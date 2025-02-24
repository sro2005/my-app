const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para registrar un nuevo cliente
router.post('/register', authController.registerCustomer);

// Ruta para registrar un nuevo administrador (datos mínimos: email y password)
router.post('/register/admin', authController.registerAdmin);

// Ruta para iniciar sesión
router.post('/login', authController.loginCustomer);

module.exports = router;