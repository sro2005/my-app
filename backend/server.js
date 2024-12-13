const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
require('dotenv').config();

const app = express();

// Usa process.env.PORT para el puerto en producción, y 5000 en desarrollo local.
const PORT = process.env.PORT || 5000;

// Define los orígenes permitidos a partir de las variables de entorno (en desarrollo será localhost y en producción Vercel).
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://my-app-peach-chi.vercel.app/'];  // Origen permitido en local por defecto (puedes modificarlo más tarde para Vercel)

// Configuración del middleware CORS
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet()); // Seguridad adicional en cabeceras HTTP
app.use(express.json()); // Middleware para analizar JSON en las solicitudes

// Conexión a MongoDB
const mongoURI = process.env.MONGODB_URI;  // Asegúrate de tener tu cadena de conexión correcta en .env
console.log('MONGODB_URI:', mongoURI);  // Esto es solo para depuración, puedes eliminarlo después de probar.
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Termina el proceso si la conexión falla
  });

// Ruta de prueba para la raíz
app.get('/api', (req, res) => {
  res.send('¡Welcome to "⚡ELECTROVIBEHOME⚡" - APIs!');
});

// Rutas de API
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);

// Ruta de comprobación de estado
app.get('/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('Database connection error');
  }
});

// Manejo de errores
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
