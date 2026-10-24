const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { limitLoginByIp, limitLoginByAccount, limitPasswordReset } = require('../middlewares/requestRateLimit');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Ruta para registrar un nuevo cliente
router.post('/register', authController.registerCustomer);

// El alta de administradores no está expuesta públicamente.
// Aprovisionar administradores mediante un proceso interno autorizado.

// Ruta para iniciar sesión
router.post('/login', limitLoginByIp, limitLoginByAccount, authController.loginCustomer);
router.put('/change-password', authenticateToken, limitPasswordReset, authController.changePassword);

module.exports = router;