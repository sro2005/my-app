const mongoose = require('mongoose');
const Order = require('../models/Order');
const { restoreInventory } = require('./productUtils');

const PENDING_WOMPI_TTL_MINUTES = 30;
const PENDING_WOMPI_TTL_MS = PENDING_WOMPI_TTL_MINUTES * 60 * 1000;
const CLEANUP_BATCH_SIZE = 100;

const expireAbandonedWompiOrders = async ({ now = new Date(), ttlMs = PENDING_WOMPI_TTL_MS } = {}) => {
  const referenceTime = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(referenceTime.getTime()) || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new TypeError('La fecha o el tiempo de expiración de Wompi no son válidos.');
  }

  const expiredBefore = new Date(referenceTime.getTime() - ttlMs);
  const eligibility = {
    paymentMethod: 'Wompi',
    paymentStatus: 'PENDING',
    paymentConfirmed: false,
    status: 'Pendiente',
    $or: [
      { checkoutStartedAt: { $lte: expiredBefore } },
      { checkoutStartedAt: { $exists: false }, orderDate: { $lte: expiredBefore } }
    ]
  };

  // Process in small batches so one sweep cannot hold a large number of inventory locks.
  const candidates = await Order.find(eligibility)
    .sort({ orderDate: 1 })
    .limit(CLEANUP_BATCH_SIZE)
    .select('_id')
    .lean();

  let expiredCount = 0;
  let failedCount = 0;

  for (const candidate of candidates) {
    let session;
    try {
      session = await mongoose.startSession();
      let expiredOrder = null;

      await session.withTransaction(async () => {
        // Compare-and-set ensures an approved webhook or another cleanup worker wins
        // atomically; stock is restored only by the worker that actually expires the order.
        expiredOrder = await Order.findOneAndUpdate(
          { ...eligibility, _id: candidate._id },
          { $set: { paymentStatus: 'EXPIRED', status: 'Cancelado' } },
          { new: true, runValidators: true, session }
        );

        if (expiredOrder) {
          await restoreInventory(expiredOrder.products, { session });
        }
      });

      if (expiredOrder) expiredCount += 1;
    } catch (error) {
      failedCount += 1;
      console.error(
        'No fue posible expirar un pedido Wompi pendiente ni liberar su inventario:',
        error.message
      );
    } finally {
      if (session) {
        try {
          await session.endSession();
        } catch (error) {
          console.error('No fue posible cerrar la sesión de limpieza Wompi:', error.message);
        }
      }
    }
  }

  return { scannedCount: candidates.length, expiredCount, failedCount };
};

module.exports = {
  expireAbandonedWompiOrders,
  PENDING_WOMPI_TTL_MINUTES,
  PENDING_WOMPI_TTL_MS
};
