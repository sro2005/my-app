const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Ruta para crear un nuevo cliente (accesible para todos los usuarios, incluidos los clientes)
router.post('/register', customerController.createCustomer);

// Ruta para obtener todos los clientes (accesible solo para admins)
// Esta ruta requiere autenticación y autorización de roles
router.get('/', authenticateToken, authorizeRoles('admin'), customerController.getCustomer);

// Ruta para iniciar sesión (accesible para todos los usuarios)
router.post('/login', customerController.loginCustomer);

// Ruta para actualizar un cliente (accesible solo para admins o el propio cliente)
// Esta ruta requiere autenticación y autorización de roles
router.put('/:id', authenticateToken, authorizeRoles('admin', 'client'), customerController.updateCustomer);

// Ruta para eliminar un cliente (accesible solo para admins)
// Esta ruta requiere autenticación y autorización de roles
router.delete('/:id', authenticateToken, authorizeRoles('admin'), customerController.deleteCustomer);

module.exports = router;

