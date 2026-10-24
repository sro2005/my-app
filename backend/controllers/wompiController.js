const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { restoreInventory } = require('../utils/productUtils');
const { secureEquals, calculateIntegritySignature, calculateEventChecksum, hasSandboxWompiCredentials } = require('../utils/wompiSecurity');

exports.createCheckout = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Identificador de pedido inválido.' });
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para pagar este pedido.' });
    }
    if (order.paymentMethod !== 'Wompi' || order.paymentStatus === 'SIMULATED') {
      return res.status(409).json({ message: 'Este pedido es de demostración y no admite checkout de Wompi.' });
    }
    if (order.paymentConfirmed || order.paymentStatus === 'APPROVED') {
      return res.status(409).json({ message: 'Este pedido ya tiene un pago aprobado.' });
    }
    // Los pedidos cancelados o con un pago rechazado no se pueden reutilizar.
    if (order.status === 'Cancelado' || order.paymentStatus !== 'PENDING') {
      return res.status(409).json({ message: 'Este pedido ya no admite pagos. Crea un nuevo pedido.' });
    }
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    const frontendUrl = process.env.FRONTEND_URL;
    if (!hasSandboxWompiCredentials({
      publicKey,
      integritySecret,
      eventsSecret: process.env.WOMPI_EVENTS_SECRET
    }) || !frontendUrl || !/^https:\/\//.test(frontendUrl)) {
      return res.status(503).json({ message: 'Los pagos aún no están configurados. Inténtalo más tarde.' });
    }

    // Una referencia por pedido: volver a abrir checkout no debe invalidar una referencia
    // anterior que pudiera terminar en una notificación de pago válida.
    let reference = order.paymentReference;
    if (!reference) {
      const candidate = `EVH-${order._id}-${crypto.randomBytes(8).toString('hex')}`;
      const claimedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: 'PENDING',
          paymentConfirmed: false,
          status: { $ne: 'Cancelado' },
          $or: [{ paymentReference: { $exists: false } }, { paymentReference: null }]
        },
        { $set: { paymentReference: candidate } },
        { new: true, runValidators: true }
      );
      if (claimedOrder) {
        reference = claimedOrder.paymentReference;
      } else {
        // Otra solicitud pudo haber creado la referencia a la vez. Reutiliza esa referencia.
        const latestOrder = await Order.findById(id);
        if (!latestOrder || latestOrder.status === 'Cancelado' || latestOrder.paymentStatus !== 'PENDING' || latestOrder.paymentConfirmed) {
          return res.status(409).json({ message: 'El pedido ya no admite un nuevo intento de pago.' });
        }
        reference = latestOrder.paymentReference;
        if (!reference) {
          return res.status(409).json({ message: 'No se pudo reservar una referencia de pago. Inténtalo nuevamente.' });
        }
      }
    }

    // Revalidar el estado antes de emitir el enlace por si un webhook lo cambió.
    const latestOrder = await Order.findById(id);
    if (!latestOrder || latestOrder.status === 'Cancelado' || latestOrder.paymentStatus !== 'PENDING' || latestOrder.paymentConfirmed) {
      return res.status(409).json({ message: 'El pedido ya no admite un nuevo intento de pago.' });
    }
    // Si una operación concurrente ya asignó otra referencia, usar siempre la persistida.
    reference = latestOrder.paymentReference || reference;
    const amountInCents = Math.round(latestOrder.totalAmount * 100);
    if (!Number.isSafeInteger(amountInCents) || amountInCents < 1) {
      return res.status(400).json({ message: 'El importe del pedido no es válido.' });
    }
    const signature = calculateIntegritySignature(reference, amountInCents, 'COP', integritySecret);

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
    if (!hasSandboxWompiCredentials({
      publicKey: process.env.WOMPI_PUBLIC_KEY,
      integritySecret: process.env.WOMPI_INTEGRITY_SECRET,
      eventsSecret: secret
    }) || event?.event !== 'transaction.updated' || !Array.isArray(event?.signature?.properties)) {
      return res.status(400).json({ message: 'Evento no válido.' });
    }
    const calculated = calculateEventChecksum(event, secret);
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

    // Compare-and-set evita que webhooks repetidos liberen el mismo inventario más de una vez.
    const pendingOrderFilter = {
      _id: order._id,
      paymentStatus: 'PENDING',
      paymentConfirmed: false,
      status: { $ne: 'Cancelado' }
    };

    const status = String(transaction.status).toUpperCase();
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
      // El cambio de estado y la devolución del inventario deben confirmarse juntos.
      // Si falla la devolución, la transacción revierte también el cambio de estado y
      // Wompi puede reintentar el webhook sin dejar el stock bloqueado permanentemente.
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const cancelledOrder = await Order.findOneAndUpdate(
            pendingOrderFilter,
            {
              $set: {
                paymentStatus: status,
                paymentTransactionId: String(transaction.id || ''),
                status: 'Cancelado'
              }
            },
            { new: true, runValidators: true, session }
          );
          if (cancelledOrder) {
            // Solo la transacción que ganó el cambio PENDING libera el inventario.
            await restoreInventory(cancelledOrder.products, { session });
          }
        });
      } finally {
        await session.endSession();
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook Wompi:', error.message);
    return res.status(400).json({ message: 'No fue posible validar el evento.' });
  }
};
