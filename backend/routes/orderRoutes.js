const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Ruta para crear un nuevo pedido (accesible solo para usuarios autenticados)
router.post('/realizar', authenticateToken, orderController.createOrder);

// Ruta para obtener todos los pedidos (accesible solo para admins)
// Esta ruta requiere autenticación y autorización de roles
router.get('/', authenticateToken, authorizeRoles('admin'), orderController.getOrders);

// Ruta para actualizar un pedido (accesible solo para admins)
// Esta ruta requiere autenticación y autorización de roles
router.put('/:id', authenticateToken, authorizeRoles('admin'), orderController.updateOrder);

// Ruta para eliminar un pedido (accesible solo para admins)
// Esta ruta requiere autenticación y autorización de roles
router.delete('/:id', authenticateToken, authorizeRoles('admin'), orderController.deleteOrder);

module.exports = router;

