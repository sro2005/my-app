const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const emailController = require('../controllers/emailController');
const { authenticateToken, authenticateAdminToken } = require('../middlewares/authMiddleware');

// Ruta para manejar la solicitud de recuperación de contraseña
router.post('/forgot-password', emailController.forgotPassword);

// Ruta para obtener todos los clientes (solo para admins)
router.get('/all', authenticateAdminToken, customerController.getCustomers);

// Ruta para obtener el perfil del cliente (requiere autenticación)
router.get('/profile', authenticateToken, customerController.getProfile);

// Ruta para actualizar un cliente (solo el usuario o un admin pueden hacerlo)
router.put('/:id', authenticateToken, customerController.updateCustomer); // Validación de autorización ya hecha en el controlador

// Ruta para eliminar un cliente (solo para admins)
router.delete('/:id', authenticateAdminToken, customerController.deleteCustomer);

module.exports = router;