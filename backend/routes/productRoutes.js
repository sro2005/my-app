const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authenticateAdminToken } = require('../middlewares/authMiddleware');

// Definir las rutas
// Ruta para obtener todos los productos (accesible para todos los usuarios)
router.get('/', productController.getProducts);

// Ruta para obtener productos según preferencias del usuario
router.get('/preferences', authenticateToken, productController.getProductsByPreferences);

// Ruta para crear un nuevo producto (protegida para admins)
router.post('/agregar', authenticateAdminToken, productController.createProduct);

// Ruta para actualizar un producto (protegida para admins)
router.put('/:id', authenticateAdminToken, productController.updateProduct);

// Ruta para eliminar un producto (protegida para admins)
router.delete('/:id', authenticateAdminToken, productController.deleteProduct);

module.exports = router;