const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Ruta para crear un nuevo cliente (accesible para todos los usuarios, incluidos los clientes)
router.post('/register', customerController.registerCustomer);

// Ruta para obtener todos los clientes (ahora accesible sin autenticación)
// Esta ruta estaba protegida para admins
router.get('/', customerController.getCustomer);

// Ruta para iniciar sesión (accesible para todos los usuarios)
router.post('/login', customerController.loginCustomer);

// Ruta para actualizar un cliente (ahora accesible sin autenticación)
// Esta ruta estaba protegida para admins o el propio cliente
router.put('/:id', customerController.updateCustomer);

// Ruta para eliminar un cliente (ahora accesible sin autenticación)
// Esta ruta estaba protegida para admins
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;

