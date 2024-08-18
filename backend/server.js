const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { authenticateToken, authorizeRole } = require('./middlewares/authMiddleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Connection error', error);
  });

// Rutas protegidas por autenticación
app.use('/api/products', authenticateToken, authorizeRole('admin'), productRoutes);
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/orders', authenticateToken, authorizeRole('admin'), orderRoutes);

// Manejo de errores
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    // Opcional: ocultar detalles técnicos en producción
    // error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});