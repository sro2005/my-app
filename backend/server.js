const fs = require('fs');
const https = require('https');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === 'production';

// Configurar CORS
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean) : '*',
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

// Conexión a MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado correctamente'))
  .catch((err) => console.error('❌ Error al conectar con MongoDB:', err));

// Rutas de la API
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

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

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en ${server === app ? 'http' : 'https'}://localhost:${PORT}`);
});