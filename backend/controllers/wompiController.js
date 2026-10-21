const crypto = require('crypto');
const Order = require('../models/Order');
const { restoreInventory } = require('../utils/productUtils');

const getPath = (object, path) => path.split('.').reduce((value, key) => value == null ? undefined : value[key], object);
const secureEquals = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

exports.createCheckout = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para pagar este pedido.' });
    }
    if (order.paymentConfirmed || order.paymentStatus === 'APPROVED') {
      return res.status(409).json({ message: 'Este pedido ya tiene un pago aprobado.' });
    }
    // Los pedidos cancelados o con un pago rechazado no se pueden reutilizar:
    // el inventario pudo haberse liberado y una aprobación tardía no debe reactivar el pedido.
    if (order.status === 'Cancelado' || order.paymentStatus !== 'PENDING') {
      return res.status(409).json({ message: 'Este pedido ya no admite pagos. Crea un nuevo pedido.' });
    }
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    const frontendUrl = process.env.FRONTEND_URL;
    if (!publicKey || !integritySecret || !frontendUrl || !/^https:\/\//.test(frontendUrl)) {
      return res.status(503).json({ message: 'Los pagos aún no están configurados. Inténtalo más tarde.' });
    }
    const reference = `EVH-${order._id}-${crypto.randomBytes(8).toString('hex')}`;
    const amountInCents = Math.round(order.totalAmount * 100);
    if (!Number.isSafeInteger(amountInCents) || amountInCents < 1) {
      return res.status(400).json({ message: 'El importe del pedido no es válido.' });
    }
    const signature = crypto.createHash('sha256')
      .update(`${reference}${amountInCents}COP${integritySecret}`)
      .digest('hex');
    order.paymentReference = reference;
    order.paymentStatus = 'PENDING';
    await order.save();

    const checkout = new URL('https://checkout.wompi.co/p/');
    checkout.searchParams.set('public-key', publicKey);
    checkout.searchParams.set('currency', 'COP');
    checkout.searchParams.set('amount-in-cents', String(amountInCents));
    checkout.searchParams.set('reference', reference);
    checkout.searchParams.set('signature:integrity', signature);
    checkout.searchParams.set('redirect-url', `${frontendUrl.replace(/\/$/, '')}/pago-resultado`);
    return res.status(200).json({ checkoutUrl: checkout.toString(), reference, amountInCents, currency: 'COP' });
  } catch (error) {
    console.error('Error preparando checkout Wompi:', error.message);
    return res.status(500).json({ message: 'No fue posible iniciar el pago.' });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    const secret = process.env.WOMPI_EVENTS_SECRET;
    if (!secret || event?.event !== 'transaction.updated' || !Array.isArray(event?.signature?.properties)) {
      return res.status(400).json({ message: 'Evento no válido.' });
    }
    const values = event.signature.properties.map(path => {
      const value = getPath(event.data, path);
      if (value === undefined || value === null) throw new Error('Propiedad de firma faltante');
      return String(value);
    });
    const calculated = crypto.createHash('sha256')
      .update(values.join('') + String(event.timestamp) + secret)
      .digest('hex');
    const supplied = req.get('X-Event-Checksum') || event.signature.checksum;
    if (!secureEquals(calculated.toLowerCase(), String(supplied || '').toLowerCase())) {
      return res.status(401).json({ message: 'Firma del evento no válida.' });
    }

    const transaction = event.data?.transaction;
    if (!transaction?.reference || !transaction?.status) {
      return res.status(400).json({ message: 'Transacción incompleta.' });
    }
    const order = await Order.findOne({ paymentReference: transaction.reference });
    if (!order) return res.status(200).json({ received: true });
    const amount = Number(transaction.amount_in_cents ?? transaction.amountInCents);
    const currency = transaction.currency;
    if (amount !== Math.round(order.totalAmount * 100) || currency !== 'COP') {
      console.error('Evento Wompi ignorado: importe o moneda no coincide con el pedido.');
      return res.status(400).json({ message: 'El importe o la moneda no coinciden.' });
    }
    // Un evento repetido o tardío no debe reactivar pedidos cuyo stock ya se liberó.
    if (order.paymentStatus !== 'PENDING' || order.status === 'Cancelado') {
      return res.status(200).json({ received: true, ignored: true });
    }

    const status = String(transaction.status).toUpperCase();
    // Compare-and-set evita que webhooks repetidos liberen el mismo inventario más de una vez.
    const pendingOrderFilter = {
      _id: order._id,
      paymentStatus: 'PENDING',
      paymentConfirmed: false,
      status: { $ne: 'Cancelado' }
    };

    if (status === 'APPROVED') {
      const approvedOrder = await Order.findOneAndUpdate(
        pendingOrderFilter,
        {
          $set: {
            paymentStatus: 'APPROVED',
            paymentConfirmed: true,
            paymentTransactionId: String(transaction.id || ''),
            ...(order.status === 'Pendiente' ? { status: 'Procesando' } : {})
          }
        },
        { new: true, runValidators: true }
      );
      if (!approvedOrder) {
        return res.status(200).json({ received: true, ignored: true });
      }
    } else if (['DECLINED', 'ERROR', 'VOIDED'].includes(status)) {
      const cancelledOrder = await Order.findOneAndUpdate(
        pendingOrderFilter,
        {
          $set: {
            paymentStatus: status,
            paymentTransactionId: String(transaction.id || ''),
            status: 'Cancelado'
          }
        },
        { new: true, runValidators: true }
      );
      if (cancelledOrder) {
        // Solo el proceso que logró cambiar PENDING a estado terminal libera el stock.
        await restoreInventory(cancelledOrder.products);
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook Wompi:', error.message);
    return res.status(400).json({ message: 'No fue posible validar el evento.' });
  }
};
