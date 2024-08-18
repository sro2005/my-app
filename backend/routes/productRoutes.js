const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Ruta para crear un nuevo pedido (accesible solo para usuarios autenticados)
// Este endpoint permite a los usuarios autenticados realizar pedidos.
// Utiliza el método POST para enviar los datos del pedido.
router.post('/realizar', authenticate, orderController.createOrder);

// Ruta para obtener todos los pedidos (accesible solo para admins)
// Este endpoint permite a los administradores obtener una lista de todos los pedidos.
// Requiere autenticación y autorización para el rol 'admin'.
router.get('/', authenticate, authorizeRoles('admin'), orderController.getOrders);

// Ruta para actualizar un pedido (accesible solo para admins)
// Este endpoint permite a los administradores actualizar un pedido específico mediante su ID.
// Utiliza el método PUT para enviar los datos actualizados.
router.put('/:id', authenticate, authorizeRoles('admin'), orderController.updateOrder);

// Ruta para eliminar un pedido (accesible solo para admins)
// Este endpoint permite a los administradores eliminar un pedido específico mediante su ID.
// Utiliza el método DELETE para eliminar el pedido.
router.delete('/:id', authenticate, authorizeRoles('admin'), orderController.deleteOrder);

module.exports = router;
