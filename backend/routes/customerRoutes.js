const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const emailController = require('../controllers/emailController'); // Asegúrate de importar emailController
const { authenticateAdminToken } = require('../middlewares/authMiddleware.js');

// Ruta para manejar la solicitud de recuperación de contraseña 
router.post('/forgot-password', emailController.forgotPassword);

// Ruta para obtener todos los clientes (protegida para admins)
router.get('/all', authenticateAdminToken, customerController.getCustomers);

// Ruta para obtener el perfil del cliente (accesible para todos los usuarios)
router.get('/profile', customerController.getProfile);

// Ruta para actualizar un cliente (protegida para el propio cliente o admins)
router.put('/:id', authenticateAdminToken, (req, res, next) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  next();
}, customerController.updateCustomer);

// Ruta para eliminar un cliente (protegida para admins)
router.delete('/:id', authenticateAdminToken, customerController.deleteCustomer);

module.exports = router;


