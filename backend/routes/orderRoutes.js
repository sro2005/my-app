const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/realizar', orderController.createOrder);
router.get('/', orderController.getOrders);
router.put('/actualizar/:id', orderController.updateOrder);
router.delete('/eliminar/:id', orderController.deleteOrder);

module.exports = router;
