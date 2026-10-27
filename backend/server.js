const fs = require('fs');
const https = require('https');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const { expireAbandonedWompiOrders, PENDING_WOMPI_TTL_MINUTES } = require('./utils/wompiPendingOrderCleanup');
const { hasSandboxWompiCredentials } = require('./utils/wompiSecurity');

// Define el archivo de entorno a usar según NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
// Cargar las variables de entorno desde el archivo correspondiente
dotenv.config({ path: envFile });
console.log('Cargando variables de entorno desde:', envFile);

// Importar rutas
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  const frontendUrl = process.env.FRONTEND_URL;
  const wompiConfigStatus = {
    publicKeyConfigured: Boolean(String(publicKey || '').trim()),
    integritySecretConfigured: Boolean(String(integritySecret || '').trim()),
    eventsSecretConfigured: Boolean(String(eventsSecret || '').trim()),
    frontendUrlHttps: typeof frontendUrl === 'string' && /^https:\/\//.test(frontendUrl),
    sandboxCredentialsReady: hasSandboxWompiCredentials({ publicKey, integritySecret, eventsSecret }) &&
      typeof frontendUrl === 'string' && /^https:\/\//.test(frontendUrl)
  };
  console.log('Estado de configuración Wompi Sandbox (solo indicadores, sin valores secretos):', JSON.stringify(wompiConfigStatus));
}

// Render requests pass through Cloudflare and Render's load balancer.
// Trust only those two proxy hops so Express derives req.ip from the forwarded chain.
// Never trust arbitrary client-supplied forwarding headers directly in application code.
app.set('trust proxy', isProduction ? 2 : false);

// Configurar CORS. En producción se exige una lista explícita de orígenes permitidos.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : (isProduction ? false : '*'),
    credentials: false, // La autenticación usa Bearer tokens; no se necesitan cookies cross-origin
  })
);

// Seguridad
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

// Logging (solo en desarrollo)
if (!isProduction) {
  const logDirectory = path.join(__dirname, 'log');
  if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory);
  const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });
  app.use(morgan('dev', { stream: accessLogStream }));
}


const schedulePendingWompiCleanup = () => {
  const intervalMs = 5 * 60 * 1000;
  let sweepInProgress = false;

  const runSweep = async () => {
    if (sweepInProgress) return;
    sweepInProgress = true;
    try {
      const result = await expireAbandonedWompiOrders();
      if (result.expiredCount > 0) {
        console.log(`Limpieza Wompi: ${result.expiredCount} pedido(s) vencido(s); inventario liberado.`);
      }
      if (result.failedCount > 0) {
        console.error(`Limpieza Wompi: ${result.failedCount} pedido(s) no pudieron procesarse; se reintentará en el siguiente ciclo.`);
      }
    } catch (error) {
      console.error('Falló el ciclo de expiración de pedidos Wompi:', error.message);
    } finally {
      sweepInProgress = false;
    }
  };

  // El barrido inicial también recupera trabajo pendiente después de reinicios del servicio.
  void runSweep();
  const timer = setInterval(() => { void runSweep(); }, intervalMs);
  timer.unref?.();
  console.log(`Limpieza automática de checkout Wompi activa: expiración tras ${PENDING_WOMPI_TTL_MINUTES} minutos.`);
};

// Conectar primero a MongoDB. No iniciar la API si la base de datos no está lista:
 // así Render puede detectar una configuración rota en lugar de dejar un backend aparentemente activo.
const connectDatabase = async () => {
  if (!MONGO_URI || !MONGO_URI.trim()) {
    throw new Error('Falta la variable de entorno MONGO_URI (también se acepta MONGODB_URI).');
  }

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ MongoDB conectado correctamente');
};

// Rutas de la API
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/assistant', assistantRoutes);

app.get('/', (req, res) => {
  // Serve a branded, static API landing page without exposing operational details.
  res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  res.type('html').send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#071326">
  <meta name="description" content="Punto de acceso oficial de la API de ElectroVibeHome.">
  <title>ElectroVibeHome | API Platform</title>
  <style>
    :root { color-scheme: dark; --bg: #071326; --panel: rgba(13, 31, 58, .78); --line: rgba(163, 194, 255, .17); --text: #f3f7ff; --muted: #9fb1ce; --blue: #4ca5ff; --cyan: #65e2e8; }
    * { box-sizing: border-box; }
    html { min-height: 100%; background: var(--bg); }
    body { margin: 0; min-height: 100vh; color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: radial-gradient(ellipse at 15% 8%, rgba(35, 112, 222, .23), transparent 37%), radial-gradient(ellipse at 86% 26%, rgba(44, 218, 222, .12), transparent 32%), linear-gradient(145deg, #071326 0%, #081a32 53%, #06101f 100%); overflow-x: hidden; }
    a { color: inherit; }
    .shell { width: min(1100px, calc(100% - 40px)); margin: 0 auto; }
    .topbar { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 28px 0; }
    .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; font-weight: 800; letter-spacing: -.035em; }
    .brand-mark { display: grid; place-items: center; width: 42px; height: 42px; border: 1px solid rgba(101, 226, 232, .38); border-radius: 14px; color: #071326; background: linear-gradient(135deg, #77ecf0, #4ca5ff); box-shadow: 0 0 28px rgba(76, 165, 255, .22); font-size: 24px; }
    .brand span { display: block; }
    .brand small { display: block; margin-top: 3px; color: var(--muted); font-size: 10px; font-weight: 700; letter-spacing: .19em; text-transform: uppercase; }
    .status { display: inline-flex; align-items: center; gap: 9px; border: 1px solid var(--line); border-radius: 999px; padding: 10px 14px; color: #c9d7ee; background: rgba(255,255,255,.035); font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 12px rgba(101,226,232,.8); }
    main { padding: 44px 0 60px; }
    .hero { position: relative; isolation: isolate; padding: clamp(28px, 6vw, 68px); border: 1px solid var(--line); border-radius: 30px; background: linear-gradient(135deg, rgba(17, 43, 78, .86), rgba(8, 23, 44, .8)); box-shadow: 0 28px 90px rgba(0,0,0,.23); overflow: hidden; }
    .hero:before { content: ""; position: absolute; z-index: -1; width: 390px; height: 390px; right: -115px; top: -170px; border-radius: 50%; border: 1px solid rgba(101,226,232,.17); box-shadow: 0 0 0 34px rgba(101,226,232,.025), 0 0 0 72px rgba(76,165,255,.025), 0 0 100px rgba(76,165,255,.12); }
    .eyebrow { display: inline-flex; align-items: center; gap: 10px; color: var(--cyan); font-size: 11px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
    .eyebrow:before { content: ""; width: 26px; height: 1px; background: var(--cyan); }
    h1 { max-width: 720px; margin: 22px 0 18px; font-size: clamp(2.7rem, 7vw, 5.4rem); line-height: .99; letter-spacing: -.065em; }
    h1 em { color: transparent; background: linear-gradient(100deg, #7aebef, #70baff 70%, #a6c9ff); background-clip: text; -webkit-background-clip: text; font-style: normal; }
    .intro { max-width: 610px; margin: 0; color: #b0c0d9; font-size: clamp(15px, 2vw, 18px); line-height: 1.8; }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 32px; }
    .button { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 10px; border: 1px solid transparent; border-radius: 13px; padding: 0 19px; font-size: 14px; font-weight: 800; text-decoration: none; transition: transform .18s ease, border-color .18s ease, background .18s ease; }
    .button:hover { transform: translateY(-2px); }
    .button-primary { color: #061326; background: linear-gradient(105deg, #7debed, #73baff); box-shadow: 0 10px 30px rgba(76,165,255,.15); }
    .button-secondary { border-color: var(--line); color: #e1eaff; background: rgba(255,255,255,.035); }
    .button-secondary:hover { border-color: rgba(101,226,232,.45); background: rgba(255,255,255,.07); }
    .arrow { font-size: 18px; line-height: 1; }
    .section-title { margin: 34px 0 15px; color: #b9c9e2; font-size: 11px; font-weight: 800; letter-spacing: .19em; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .tile { min-height: 150px; padding: 23px; border: 1px solid var(--line); border-radius: 19px; background: var(--panel); }
    .tile-icon { display: grid; place-items: center; width: 39px; height: 39px; margin-bottom: 18px; border: 1px solid rgba(101,226,232,.19); border-radius: 12px; color: var(--cyan); background: rgba(76,165,255,.09); }
    .tile h2 { margin: 0 0 8px; font-size: 15px; letter-spacing: -.02em; }
    .tile p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.65; }
    .footnote { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 22px 0 30px; color: #8296b5; font-size: 12px; }
    .footnote strong { color: #bdcde5; font-weight: 700; }
    @media (max-width: 650px) { .shell { width: min(100% - 28px, 1100px); } .topbar { align-items: flex-start; padding: 20px 0; } .status { padding: 8px 10px; font-size: 10px; } .brand { gap: 9px; font-size: 14px; } .brand-mark { width: 38px; height: 38px; } main { padding: 24px 0 38px; } .hero { border-radius: 23px; } .grid { grid-template-columns: 1fr; } .tile { min-height: auto; } .tile-icon { margin-bottom: 13px; } .footnote { flex-direction: column; } }
    @media (prefers-reduced-motion: reduce) { *, *:before, *:after { transition: none !important; scroll-behavior: auto !important; } }
  </style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <a class="brand" href="https://electrovibehome.onrender.com" aria-label="ElectroVibeHome, abrir tienda">
        <span class="brand-mark" aria-hidden="true">⚡</span>
        <span>ELECTROVIBEHOME<small>Digital platform</small></span>
      </a>
      <div class="status"><span class="status-dot" aria-hidden="true"></span> Punto de acceso API</div>
    </header>
    <main>
      <section class="hero" aria-labelledby="page-title">
        <div class="eyebrow">La tecnología detrás de la experiencia</div>
        <h1 id="page-title">Energía digital.<br><em>Conexiones inteligentes.</em></h1>
        <p class="intro">Este es el centro de servicios de ElectroVibeHome: una API REST que conecta la experiencia de la tienda con sus operaciones y datos.</p>
        <div class="actions">
          <a class="button button-primary" href="https://electrovibehome.onrender.com">Explorar la tienda <span class="arrow" aria-hidden="true">↗</span></a>
          <a class="button button-secondary" href="/health">Consultar estado técnico <span class="arrow" aria-hidden="true">→</span></a>
        </div>
      </section>
      <div class="section-title">Servicios de la plataforma</div>
      <section class="grid" aria-label="Capacidades de la API">
        <article class="tile">
          <div class="tile-icon" aria-hidden="true">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18l-2 7H5L3 4Z"/><path d="M5 11v8h14v-8M9 19v-5h6v5"/></svg>
          </div>
          <h2>Catálogo y productos</h2>
          <p>Servicios para consultar la oferta y mantener la información de productos.</p>
        </article>
        <article class="tile">
          <div class="tile-icon" aria-hidden="true">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>
          </div>
          <h2>Acceso y cuentas</h2>
          <p>Flujos de autenticación y acceso a las funciones según el perfil del usuario.</p>
        </article>
        <article class="tile">
          <div class="tile-icon" aria-hidden="true">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v14H4zM8 9h8M8 13h5"/><path d="m9 19 2 2 4-4"/></svg>
          </div>
          <h2>Gestión de pedidos</h2>
          <p>Operaciones para registrar y consultar pedidos de la experiencia de compra.</p>
        </article>
      </section>
    </main>
    <footer class="footnote">
      <span>© ElectroVibeHome · <strong>API Platform</strong></span>
      <span>Un servicio para conectar la experiencia digital.</span>
    </footer>
  </div>
</body>
</html>`);
});
app.get('/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  const status = databaseReady ? 200 : 503;
  res.status(status).json({
    status: databaseReady ? 'ok' : 'degraded',
    database: databaseReady ? 'connected' : 'disconnected'
  });
});

// Middleware de error centralizado: no expone detalles internos al cliente.
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  console.error('Error de servidor:', err.message);
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500
    ? err.status
    : 500;
  const message = status < 500 && typeof err.message === 'string'
    ? err.message
    : 'Error interno del servidor';
  res.status(status).json({ message });
});

// Opcional: Servidor HTTPS solo si los certificados están disponibles
let server;
if (!isProduction) {
try {
  const sslOptions = {
    key: fs.readFileSync('./localhost-key.pem'),
    cert: fs.readFileSync('./localhost.pem'),
  };
  server = https.createServer(sslOptions, app);
  console.log('✅ Servidor HTTPS activado');
} catch (error) {
  console.warn('⚠️ No se encontraron certificados SSL. Usando HTTP.');
  server = app;
}
} else {
  // En producción se usa HTTP (el proxy reverso se encarga de HTTPS)
  server = app;
}

// Iniciar la API únicamente después de confirmar la conexión a la base de datos.
connectDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en ${server === app ? 'http' : 'https'}://localhost:${PORT}`);
      if (isProduction) schedulePendingWompiCleanup();
    });
  })
  .catch((error) => {
    // No registrar la URI ni otros datos de conexión en los logs.
    console.error('❌ No fue posible iniciar el backend: revisa MONGODB_URI, las credenciales y el acceso de red de Atlas.', error.message);
    process.exit(1);
  });
