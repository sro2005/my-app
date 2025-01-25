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
  phone: { type: String, required: true, match: /^\+\d{1,3}\s\d{3}\s\d{7}$/ }, // Aceptar + seguido por dígitos
  address: { type: String, required: true },
  paymentMethod: { type: String, required: true, enum: ['Credit Card', 'Debit Card', 'PayPal', 'Cash'] }, // Ejemplo de métodos de pago
  deliveryDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true, min: 0 }, // Asegura que el monto total sea al menos 0
  products: { type: [productSchema], required: true }
});

// Pre-hook para validar la disponibilidad de productos antes de guardar
orderSchema.pre('save', async function(next) {
  const order = this;
  for (const item of order.products) {
    const product = await mongoose.model('Product').findById(item.productId);
    if (!product) {
      return next(new Error(`Producto con ID ${item.productId} no encontrado`));
    }
    if (product.quantity < item.quantity) {
      return next(new Error(`El producto ${product.name} no tiene suficiente inventario`));
    }
  }
  next();
});

// Pre-hook para reducir inventario de productos después de guardar
orderSchema.post('save', async function(doc, next) {
  for (const item of doc.products) {
    const product = await mongoose.model('Product').findById(item.productId);
    product.quantity -= item.quantity;
    await product.save();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

