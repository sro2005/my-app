const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController'); // Asegúrate de que esta ruta es correcta

// Definir las rutas
router.get('/', productController.getProducts); // Verifica que `getProducts` está definido en `productController`
router.post('/agregar', productController.createProduct); // Verifica que `createProduct` está definido en `productController`
router.put('/:id', productController.updateProduct); // Verifica que `updateProduct` está definido en `productController`
router.delete('/:id', productController.deleteProduct); // Verifica que `deleteProduct` está definido en `productController`

module.exports = router;
