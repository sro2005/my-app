const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.post('/agregar', productController.createProduct);
router.get('/', productController.getProducts);
router.put('/actualizar/:id', productController.updateProduct);
router.delete('/eliminar/:id', productController.deleteProduct);

module.exports = router;
