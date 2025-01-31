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
    console.log(`Reduciendo inventario para ${product.name}: cantidad actual ${product.quantity}, reduciendo por ${item.quantity}`);
    product.quantity -= item.quantity;
    await product.save();
    console.log(`Nuevo inventario para ${product.name}: ${product.quantity}`);
  }
};

// Función para restaurar inventario de productos
exports.restoreInventory = async (products) => {
  for (const item of products) {
    const product = await Product.findById(item.productId);
    console.log(`Restaurando inventario para ${product.name}: cantidad actual ${product.quantity}, aumentando por ${item.quantity}`);
    product.quantity += item.quantity;
    await product.save();
    console.log(`Nuevo inventario para ${product.name}: ${product.quantity}`);
  }
};