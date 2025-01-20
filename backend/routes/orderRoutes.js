const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Ruta para crear un nuevo pedido (protegida para usuarios autenticados)
router.post('/realizar', authenticate, orderController.createOrder);

// Ruta para obtener todos los pedidos (protegida para admins)
router.get('/', authenticate, authorizeAdmin, orderController.getOrders);

// Ruta para actualizar un pedido (protegida para admins)
router.put('/:id', authenticate, authorizeAdmin, orderController.updateOrder);

// Ruta para eliminar un pedido (protegida para admins)
router.delete('/:id', authenticate, authorizeAdmin, orderController.deleteOrder);

module.exports = router;

