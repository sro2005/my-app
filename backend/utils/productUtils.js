const Product = require('../models/Product');

// Función para validar los productos
exports.validateProducts = async (products) => {
  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Producto con ID ${item.productId} no encontrado`);
    }
    if (product.quantity < item.quantity) {
      throw new Error(`El producto ${product.name} no tiene suficiente inventario`);
    }
  }
};

// Función para reducir inventario de productos
exports.reduceInventory = async (products) => {
  for (const item of products) {
    const product = await Product.findById(item.productId);
    product.quantity -= item.quantity;
    await product.save();
  }
};
