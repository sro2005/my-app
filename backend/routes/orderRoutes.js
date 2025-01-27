const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateAdminToken } = require('../middlewares/authMiddleware.js');

// Ruta para crear un nuevo pedido (abierto para usuarios normales)
router.post('/realizar', orderController.createOrder);

// Ruta para obtener todos los pedidos (protegida para admins)
router.get('/', authenticateAdminToken, orderController.getOrders);

// Ruta para actualizar un pedido (protegida para admins)
router.put('/:id', authenticateAdminToken, orderController.updateOrder);

// Ruta para eliminar un pedido (protegida para admins)
router.delete('/:id', authenticateAdminToken, orderController.deleteOrder);

module.exports = router;

