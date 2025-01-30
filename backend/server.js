const fs = require('fs');
const https = require('https');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config(); // Cargar variables de entorno

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
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true, // Permitir cookies y autenticación en solicitudes cross-origin
  })
);

// Seguridad
app.use(helmet());
app.use(express.json());

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
app.get('/health', (req, res) => res.status(200).send('API funcionando'));

// Middleware de error centralizado
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
});

// Opcional: Servidor HTTPS solo si los certificados están disponibles
let server;
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

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en ${server === app ? 'http' : 'https'}://localhost:${PORT}`);
});
