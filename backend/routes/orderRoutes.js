const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Ruta para crear un nuevo pedido (ahora accesible sin autenticación)
router.post('/realizar', orderController.createOrder);

// Ruta para obtener todos los pedidos (ahora accesible sin autenticación)
// Esta ruta estaba protegida para admins
router.get('/', orderController.getOrders);

// Ruta para actualizar un pedido (ahora accesible sin autenticación)
// Esta ruta estaba protegida para admins
router.put('/:id', orderController.updateOrder);

// Ruta para eliminar un pedido (ahora accesible sin autenticación)
// Esta ruta estaba protegida para admins
router.delete('/:id', orderController.deleteOrder);

module.exports = router;

