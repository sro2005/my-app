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

app.get('/', (req, res) => res.send('Bienvenido a ⚡ELECTROVIBEHOME⚡ API'));
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
