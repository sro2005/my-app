const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { expireAbandonedWompiOrders, PENDING_WOMPI_TTL_MS } = require('./wompiPendingOrderCleanup');

const orderId = '507f1f77bcf86cd799439011';
const productId = '507f191e810c19729de860ea';

const makeQuery = rows => ({
  sort() { return this; },
  limit() { return this; },
  select() { return this; },
  lean: async () => rows
});

const installCleanupStubs = (t, { candidates = [{ _id: orderId }], expiredOrder = null } = {}) => {
  const originals = {
    find: Order.find,
    findOneAndUpdate: Order.findOneAndUpdate,
    startSession: mongoose.startSession,
    updateOne: Product.updateOne
  };
  t.after(() => {
    Order.find = originals.find;
    Order.findOneAndUpdate = originals.findOneAndUpdate;
    mongoose.startSession = originals.startSession;
    Product.updateOne = originals.updateOne;
  });

  let queryFilter;
  let updateFilter;
  let updateDoc;
  let updateOptions;
  let restoreCalls = 0;
  const session = {
    withTransaction: async callback => callback(),
    endSession: async () => {}
  };

  Order.find = filter => {
    queryFilter = filter;
    return makeQuery(candidates);
  };
  Order.findOneAndUpdate = async (filter, update, options) => {
    updateFilter = filter;
    updateDoc = update;
    updateOptions = options;
    return typeof expiredOrder === 'function' ? expiredOrder(filter, update, options) : expiredOrder;
  };
  mongoose.startSession = async () => session;
  Product.updateOne = async (_filter, _update, options) => {
    restoreCalls += 1;
    assert.equal(options.session, session);
    return { matchedCount: 1, modifiedCount: 1 };
  };

  return {
    session,
    get queryFilter() { return queryFilter; },
    get updateFilter() { return updateFilter; },
    get updateDoc() { return updateDoc; },
    get updateOptions() { return updateOptions; },
    get restoreCalls() { return restoreCalls; }
  };
};

test('expires old pending Wompi orders and restores inventory inside the same transaction', async t => {
  const expiredOrder = {
    _id: orderId,
    products: [{ productId, quantity: 2 }]
  };
  const stubs = installCleanupStubs(t, { expiredOrder });
  const now = new Date('2026-10-25T12:00:00.000Z');

  const result = await expireAbandonedWompiOrders({ now });

  assert.deepEqual(result, { scannedCount: 1, expiredCount: 1, failedCount: 0 });
  assert.equal(stubs.queryFilter.paymentMethod, 'Wompi');
  assert.equal(stubs.queryFilter.paymentStatus, 'PENDING');
  assert.equal(stubs.queryFilter.paymentConfirmed, false);
  assert.equal(stubs.queryFilter.status, 'Pendiente');
  assert.equal(stubs.queryFilter.$or[0].checkoutStartedAt.$lte.getTime(), now.getTime() - PENDING_WOMPI_TTL_MS);
  assert.equal(stubs.updateFilter.paymentStatus, 'PENDING');
  assert.equal(stubs.updateFilter.paymentConfirmed, false);
  assert.equal(stubs.updateDoc.$set.paymentStatus, 'EXPIRED');
  assert.equal(stubs.updateDoc.$set.status, 'Cancelado');
  assert.equal(stubs.updateOptions.session, stubs.session);
  assert.equal(stubs.restoreCalls, 1);
});

test('does not restore inventory when a webhook or another worker already changed the order', async t => {
  const stubs = installCleanupStubs(t, { expiredOrder: null });

  const result = await expireAbandonedWompiOrders({
    now: new Date('2026-10-25T12:00:00.000Z')
  });

  assert.deepEqual(result, { scannedCount: 1, expiredCount: 0, failedCount: 0 });
  assert.equal(stubs.restoreCalls, 0);
});

test('rejects invalid cleanup timeouts instead of silently expiring orders', async () => {
  await assert.rejects(
    expireAbandonedWompiOrders({ now: new Date(), ttlMs: 0 }),
    /tiempo de expiración/
  );
});
