const fs = require('fs');
const https = require('https');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rfs = require('rotating-file-stream');
require('dotenv').config(); // Cargar las variables de entorno

// Importar rutas
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Configurar puerto dinámico para producción o local
const PORT = process.env.PORT || 5000; // Si no hay variable de entorno, usa 5000 para desarrollo

// Configuración CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Seguridad
app.use(helmet());
app.use(express.json());

// Configuración de logging
const logDirectory = path.join(__dirname, 'log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotar diariamente
  path: logDirectory
});

app.use(morgan('combined', { stream: accessLogStream }));

// Conexión a MongoDB
console.log('Connecting to MongoDB...');
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Middleware para verificar la conexión a la base de datos
const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database connection failed' });
  }
  next();
};

app.use(checkDbConnection);

// Definición de rutas
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

// Ruta para la raíz
app.get('/', (req, res) => {
  res.send('Welcome to ⚡ELECTROVIBEHOME⚡ API');
});

// Ruta de prueba
app.get('/health', (req, res) => res.status(200).send('API running'));

// Manejo de errores de rutas no encontradas
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Middleware de manejo de errores centralizado
const errorHandler = (err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({
    message: err.message,
  });
};

app.use(errorHandler);

// Leer los certificados SSL
const sslOptions = {};
try {
  sslOptions.key = fs.readFileSync('./localhost-key.pem');
  sslOptions.cert = fs.readFileSync('./localhost.pem');
} catch (error) {
  console.error('Error reading SSL certificates:', error);
  process.exit(1);
}

// Iniciar el servidor HTTPS
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});
