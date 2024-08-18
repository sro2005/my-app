const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Ruta para crear un nuevo producto (accesible solo para admins)
// Este endpoint permite a los administradores agregar nuevos productos.
router.post('/agregar', authenticate, authorizeRoles('admin'), productController.createProduct);

// Ruta para obtener todos los productos (accesible para todos los usuarios)
// Este endpoint permite a cualquier usuario obtener una lista de todos los productos.
router.get('/', productController.getProducts);

// Ruta para obtener un producto específico por su ID (accesible para todos los usuarios)
// Este endpoint permite a cualquier usuario obtener información sobre un producto específico mediante su ID.
router.get('/:id', productController.getProductById);

// Ruta para actualizar un producto específico por su ID (accesible solo para admins)
// Este endpoint permite a los administradores actualizar un producto específico mediante su ID.
router.put('/:id', authenticate, authorizeRoles('admin'), productController.updateProduct);

// Ruta para eliminar un producto específico por su ID (accesible solo para admins)
// Este endpoint permite a los administradores eliminar un producto específico mediante su ID.
router.delete('/:id', authenticate, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;
