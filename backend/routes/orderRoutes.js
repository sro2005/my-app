const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Ruta para crear un nuevo pedido (accesible solo para usuarios autenticados)
router.post('/realizar', authenticate, orderController.createOrder);

// Ruta para obtener todos los pedidos (accesible solo para admins)
// Esta ruta requiere autenticación y autorización de roles
router.get('/', authenticate, authorizeRoles('admin'), orderController.getOrders);

// Ruta para actualizar un pedido (accesible solo para admins)
// Esta ruta requiere autenticación y autorización de roles
router.put('/:id', authenticate, authorizeRoles('admin'), orderController.updateOrder);

// Ruta para eliminar un pedido (accesible solo para admins)
// Esta ruta requiere autenticación y autorización de roles
router.delete('/:id', authenticate, authorizeRoles('admin'), orderController.deleteOrder);

module.exports = router;

