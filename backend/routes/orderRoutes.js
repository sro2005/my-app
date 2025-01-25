const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Ruta para crear un nuevo pedido (protegida para usuarios autenticados)
router.post('/realizar', authenticateToken, orderController.createOrder);

// Ruta para obtener todos los pedidos (protegida para admins)
router.get('/', authenticateToken, authorizeRole('admin'), orderController.getOrders);

// Ruta para actualizar un pedido (protegida para admins)
router.put('/:id', authenticateToken, authorizeRole('admin'), orderController.updateOrder);

// Ruta para eliminar un pedido (protegida para admins)
router.delete('/:id', authenticateToken, authorizeRole('admin'), orderController.deleteOrder);

module.exports = router;


