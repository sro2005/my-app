const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authenticateAdminToken } = require('../middlewares/authMiddleware.js');

// Ruta para crear un nuevo pedido (abierto para usuarios normales, pero con autenticación)
router.post('/realizar', authenticateToken, orderController.createOrder);

// Ruta para obtener todos los pedidos (solo para administradores)
router.get('/all', authenticateAdminToken, orderController.getOrders);

// Ruta para obtener los pedidos de un usuario (solo para usuarios normales)
router.get('/:userId', authenticateToken, orderController.getUserOrders);

// Ruta para actualizar un pedido (solo para administradores)
router.put('/:id', authenticateAdminToken, orderController.updateOrder);

// Ruta para eliminar un pedido (solo para administradores)
router.delete('/:id', authenticateAdminToken, orderController.deleteOrder);

module.exports = router;
