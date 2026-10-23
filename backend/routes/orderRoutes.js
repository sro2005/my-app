const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authenticateAdminToken } = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/wompiController');

// Crear un pedido requiere una sesión autenticada.
router.post('/realizar', authenticateToken, orderController.createOrder);
router.post('/:id/wompi-checkout', authenticateToken, paymentController.createCheckout);
router.post('/wompi/webhook', paymentController.handleWebhook);

// Los clientes solo pueden consultar sus propios pedidos; la lista completa es exclusiva de admins.
router.get('/all', authenticateAdminToken, orderController.getOrders);
router.get('/my-orders', authenticateToken, orderController.getOrdersByUserId);

// Edición logística limitada y cambios de estado solo para administradores.
router.put('/:id/status', authenticateAdminToken, orderController.updateOrderStatusAutomatically);
router.put('/:id', authenticateAdminToken, orderController.updateOrder);

// Eliminar pedidos solo para administradores y con las protecciones del controlador.
router.delete('/:id', authenticateAdminToken, orderController.deleteOrder);

module.exports = router;
