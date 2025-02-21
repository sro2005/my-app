const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authenticateAdminToken } = require('../middlewares/authMiddleware');

// Ruta para crear un nuevo pedido (abierto para usuarios normales, pero con autenticación)
router.post('/realizar', authenticateToken, orderController.createOrder);

// Ruta para obtener todos los pedidos (solo para administradores)
router.get('/all', authenticateAdminToken, orderController.getOrders);

// Ruta para obtener un pedido específico por su ID (abierto para usuarios autenticados)
router.get('/my-orders', authenticateToken, orderController.getOrdersByUserId);

// Ruta para actualizar un pedido (solo para administradores)
// Ruta para actualizar automáticamente el estado de un pedido
router.put('/:id/status', authenticateAdminToken, orderController.updateOrderStatusAutomatically);

// Ruta para eliminar un pedido (solo para administradores)
router.delete('/:id', authenticateAdminToken, orderController.deleteOrder);

module.exports = router;