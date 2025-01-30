const mongoose = require('mongoose');

// Esquema anidado para productos en el pedido
const productSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  quantity: { type: Number, required: true, min: 1 } // Asegura que la cantidad mínima sea 1
});

// Definición del esquema del pedido
const orderSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, match: /\S+@\S+\.\S+/ },
  phone: { type: String, required: true, match: /^\+?[0-9]{10,15}$/ }, // Validación de formato de teléfono
  address: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true, min: 0 }, // Puede dejarse si prefieres validarlo
  products: { type: [productSchema], required: true }
});

// Pre-hook para validar la disponibilidad de productos antes de guardar
orderSchema.pre('save', async function(next) {
  const order = this;
  try {
    // Buscar todos los productos de una sola vez
    const products = await mongoose.model('Product').find({ 
      '_id': { $in: order.products.map(item => item.productId) }
    });

    for (const item of order.products) {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      if (!product) {
        return next(new Error(`Producto con ID ${item.productId} no encontrado`));
      }
      // Validación de inventario
      if (product.quantity < item.quantity) {
        return next(new Error(`El producto ${product.name} no tiene suficiente inventario. Solo hay ${product.quantity} disponible.`));
      }
    }
    next();
  } catch (error) {
    next(error); // Manejo de errores si ocurre algún fallo en las búsquedas
  }
});

// Post-hook para reducir inventario de productos después de guardar
orderSchema.post('save', async function(doc, next) {
  try {
    const productUpdates = doc.products.map(item => {
      return mongoose.model('Product').findByIdAndUpdate(
        item.productId, 
        { $inc: { quantity: -item.quantity } }, 
        { new: true }
      );
    });

    // Ejecutar todas las actualizaciones en paralelo
    await Promise.all(productUpdates);
    next();
  } catch (error) {
    console.error('Error al reducir inventario:', error);
    next(error);
  }
});

module.exports = mongoose.model('Order', orderSchema);


