const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController'); // Asegúrate de que esta ruta es correcta
const { authenticate, authorizeAdmin } = require('../middleware/auth'); // Importar middleware de autenticación y autorización

// Definir las rutas
// Ruta para obtener todos los productos (accesible para todos los usuarios)
router.get('/', productController.getProducts);

// Ruta para crear un nuevo producto (protegida para admins)
router.post('/agregar', authenticate, authorizeAdmin, productController.createProduct);

// Ruta para actualizar un producto (protegida para admins)
router.put('/:id', authenticate, authorizeAdmin, productController.updateProduct);

// Ruta para eliminar un producto (protegida para admins)
router.delete('/:id', authenticate, authorizeAdmin, productController.deleteProduct);

module.exports = router;

