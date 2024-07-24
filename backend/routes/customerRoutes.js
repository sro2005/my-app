const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Ruta para crear un nuevo cliente
router.post('/register', customerController.createCustomer);

// Ruta para obtener todos los clientes
router.get('/', customerController.getCustomer);

// Ruta para iniciar sesión
router.post('/login', customerController.loginCustomer);

// Ruta para actualizar un cliente
router.put('/:id', customerController.updateCustomer);

// Ruta para eliminar un cliente
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
