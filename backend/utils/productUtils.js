const Product = require('../models/Product');

const aggregateItems = (products) => {
  const totals = new Map();
  for (const item of products) {
    const id = String(item.productId);
    totals.set(id, (totals.get(id) || 0) + Number(item.quantity));
  }
  return Array.from(totals, ([productId, quantity]) => ({ productId, quantity }));
};

exports.validateProducts = async (products, options = {}) => {
  for (const item of aggregateItems(products)) {
    const query = Product.findById(item.productId);
    if (options.session) query.session(options.session);
    const product = await query;
    if (!product) throw new Error('Uno de los productos ya no está disponible.');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || product.quantity < item.quantity) {
      throw new Error(`Stock insuficiente para ${product.name}.`);
    }
  }
};

// Actualización atómica de stock; revierte los cambios ya aplicados si un artículo falla.
exports.reduceInventory = async (products, options = {}) => {
  const applied = [];
  try {
    for (const item of aggregateItems(products)) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true, ...(options.session ? { session: options.session } : {}) }
      );
      if (!product) throw new Error('Stock insuficiente o producto no disponible.');
      applied.push(item);
    }
  } catch (error) {
    for (const item of applied.reverse()) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { quantity: item.quantity } },
        options.session ? { session: options.session } : {}
      );
    }
    throw error;
  }
};

exports.restoreInventory = async (products, options = {}) => {
  for (const item of aggregateItems(products)) {
    await Product.updateOne(
      { _id: item.productId },
      { $inc: { quantity: item.quantity } },
      options
    );
  }
};
