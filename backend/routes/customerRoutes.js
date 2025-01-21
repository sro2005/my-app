const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Ruta para crear un nuevo cliente (accesible para todos los usuarios, incluidos los clientes)
router.post('/register', customerController.registerCustomer);

// Ruta para iniciar sesión (accesible para todos los usuarios)
router.post('/login', customerController.loginCustomer);

// Ruta para manejar la solicitud de recuperación de contraseña 
router.post('/forgot-password', customerController.forgotPassword);

// Ruta para obtener todos los clientes (protegida para admins)
router.get('/', authenticate, authorizeAdmin, customerController.getCustomers);

// Ruta para actualizar un cliente (protegida para el propio cliente o admins)
router.put('/:id', authenticate, (req, res, next) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  next();
}, customerController.updateCustomer);

// Ruta para eliminar un cliente (protegida para admins)
router.delete('/:id', authenticate, authorizeAdmin, customerController.deleteCustomer);

module.exports = router;

