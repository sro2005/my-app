const test = require('node:test');
const assert = require('node:assert/strict');
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { updateOrderStatusAutomatically, createOrder, reviewManualPayment } = require('./orderController');

const validId = '507f1f77bcf86cd799439011';
const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

const makeOrder = overrides => ({
  _id: validId,
  paymentConfirmed: true,
  paymentStatus: 'APPROVED',
  status: 'Procesando',
  packed: false,
  delivered: false,
  save: async function () { this.saved = true; },
  ...overrides
});

test('rejects malformed order ids before querying MongoDB', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  let calls = 0;
  Order.findById = async () => { calls += 1; };

  const response = createResponse();
  await updateOrderStatusAutomatically({ params: { id: 'invalid' }, body: { packed: true } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});

test('allows an admin logistics transition only after payment approval', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  const order = makeOrder({ paymentConfirmed: false, paymentStatus: 'PENDING' });
  Order.findById = async () => order;

  const response = createResponse();
  await updateOrderStatusAutomatically({ params: { id: validId }, body: { packed: true } }, response);

  assert.equal(response.statusCode, 409);
  assert.equal(order.saved, undefined);
  assert.equal(order.status, 'Procesando');
});

test('moves a paid order from processing to shipped when admin marks it prepared', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  const order = makeOrder();
  Order.findById = async () => order;

  const response = createResponse();
  await updateOrderStatusAutomatically({ params: { id: validId }, body: { packed: true } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(order.packed, true);
  assert.equal(order.status, 'Enviado');
  assert.equal(order.saved, true);
});

test('allows an admin to ship a confirmed fictional purchase without a real payment', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  const order = makeOrder({ paymentStatus: 'SIMULATED', paymentMethod: 'Demostración' });
  Order.findById = async () => order;

  const response = createResponse();
  await updateOrderStatusAutomatically({ params: { id: validId }, body: { packed: true } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(order.packed, true);
  assert.equal(order.status, 'Enviado');
  assert.equal(order.saved, true);
});

test('blocks preparation until the coordinated payment has been reviewed', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  const order = makeOrder({ paymentMethod: 'Pago pendiente de coordinación', paymentConfirmed: false, paymentStatus: 'PENDING', status: 'Pendiente' });
  Order.findById = async () => order;
  const response = createResponse();
  await updateOrderStatusAutomatically({ params: { id: validId }, body: { prepare: true } }, response);
  assert.equal(response.statusCode, 409);
  assert.equal(order.status, 'Pendiente');
  assert.equal(order.paymentStatus, 'PENDING');
  assert.equal(order.paymentConfirmed, false);
  assert.equal(order.saved, undefined);
});

test('blocks shipping while a coordinated payment remains pending', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  const order = makeOrder({ paymentMethod: 'Pago pendiente de coordinación', paymentConfirmed: false, paymentStatus: 'PENDING', status: 'Procesando' });
  Order.findById = async () => order;
  const response = createResponse();
  await updateOrderStatusAutomatically({ params: { id: validId }, body: { packed: true } }, response);
  assert.equal(response.statusCode, 409);
  assert.equal(order.status, 'Procesando');
  assert.equal(order.paymentStatus, 'PENDING');
  assert.equal(order.paymentConfirmed, false);
  assert.equal(order.saved, undefined);
});

test('requires the order to be shipped before marking it delivered', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  const order = makeOrder();
  Order.findById = async () => order;

  const response = createResponse();
  await updateOrderStatusAutomatically({ params: { id: validId }, body: { delivered: true } }, response);

  assert.equal(response.statusCode, 409);
  assert.equal(order.saved, undefined);
  assert.equal(order.delivered, false);
});

test('moves a shipped order to delivered when admin confirms delivery', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  const order = makeOrder({ status: 'Enviado', packed: true });
  Order.findById = async () => order;

  const response = createResponse();
  await updateOrderStatusAutomatically({ params: { id: validId }, body: { delivered: true } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(order.delivered, true);
  assert.equal(order.status, 'Entregado');
  assert.equal(order.saved, true);
});

test('rejects unsupported status fields instead of accepting arbitrary state changes', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  const order = makeOrder();
  Order.findById = async () => order;

  const response = createResponse();
  await updateOrderStatusAutomatically({ params: { id: validId }, body: { status: 'Entregado' } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(order.saved, undefined);
});


test('createOrder refuses administrator accounts before querying or changing order data', async () => {
  let queries = 0;
  const originalFindOne = Order.findOne;
  Order.findOne = async () => { queries += 1; return null; };
  try {
    const response = createResponse();
    await createOrder({
      user: { _id: validId, role: 'admin' },
      get: () => undefined,
      body: {
        firstName: 'Admin', lastName: 'Demo', email: 'company@example.test',
        phone: '+57 300 000 0000', address: 'Dirección demo',
        paymentMethod: 'Demostración', deliveryDate: '2099-01-01',
        products: [{ productId: validId, quantity: 1 }]
      }
    }, response);

    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /cuentas de cliente/i);
    assert.equal(queries, 0);
  } finally {
    Order.findOne = originalFindOne;
  }
});

test('createOrder returns an existing order for a repeated idempotency key without reserving stock again', async t => {
  const originalFindOne = Order.findOne;
  const originalStartSession = mongoose.startSession;
  t.after(() => {
    Order.findOne = originalFindOne;
    mongoose.startSession = originalStartSession;
  });

  const existingOrder = { _id: 'existing-order-id', paymentStatus: 'PENDING' };
  let lookupFilter;
  let startSessionCalls = 0;
  Order.findOne = async filter => {
    lookupFilter = filter;
    return existingOrder;
  };
  mongoose.startSession = async () => {
    startSessionCalls += 1;
    throw new Error('Should not start a transaction for a repeated request');
  };

  const key = 'request-key-1234567890';
  const response = createResponse();
  await createOrder({
    user: { _id: validId, role: 'user' },
    get: name => name === 'Idempotency-Key' ? key : undefined,
    body: {
      firstName: 'Cliente',
      lastName: 'Demo',
      email: 'cliente@example.com',
      phone: '+57 300 123 4567',
      address: 'Calle 10 # 20-30, Bogotá',
      paymentMethod: 'Wompi',
      deliveryDate: '2099-01-01',
      products: [{ productId: validId, quantity: 1 }]
    }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.order, existingOrder);
  assert.equal(lookupFilter.userId.toString(), validId);
  assert.equal(lookupFilter.idempotencyKey, key);
  assert.equal(startSessionCalls, 0);
});

test('createOrder rejects malformed idempotency keys before querying orders', async t => {
  const originalFindOne = Order.findOne;
  t.after(() => { Order.findOne = originalFindOne; });
  let calls = 0;
  Order.findOne = async () => { calls += 1; return null; };

  const response = createResponse();
  await createOrder({
    user: { _id: validId, role: 'user' },
    get: name => name === 'Idempotency-Key' ? 'short' : undefined,
    body: {}
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});


const configureSandbox = t => {
  const names = ['WOMPI_PUBLIC_KEY', 'WOMPI_INTEGRITY_SECRET', 'WOMPI_EVENTS_SECRET', 'FRONTEND_URL'];
  const old = Object.fromEntries(names.map(name => [name, process.env[name]]));
  process.env.WOMPI_PUBLIC_KEY = 'pub_test_unit-test';
  process.env.WOMPI_INTEGRITY_SECRET = 'test_integrity_unit-test';
  process.env.WOMPI_EVENTS_SECRET = 'test_events_unit-test';
  process.env.FRONTEND_URL = 'https://preview.example.test';
  t.after(() => {
    for (const name of names) {
      if (old[name] === undefined) delete process.env[name];
      else process.env[name] = old[name];
    }
  });
};

const validOrderBody = () => ({
  firstName: 'Cliente',
  lastName: 'Demo',
  email: 'cliente@example.com',
  phone: '+57 300 123 4567',
  address: 'Calle 10 # 20-30, Bogotá',
  paymentMethod: 'Wompi',
  deliveryDate: '2099-01-01',
  products: [{ productId: validId, quantity: 1 }]
});

test('createOrder returns 500 for uncertain transaction failures so the client can reuse its idempotency key', async t => {
  configureSandbox(t);
  const originalStartSession = mongoose.startSession;
  t.after(() => { mongoose.startSession = originalStartSession; });
  mongoose.startSession = async () => ({
    withTransaction: async () => { throw new Error('database transaction unavailable'); },
    endSession: async () => {}
  });

  const response = createResponse();
  await createOrder({
    user: { _id: validId, role: 'user' },
    get: () => undefined,
    body: validOrderBody()
  }, response);

  assert.equal(response.statusCode, 500);
  assert.match(response.body.message, /Reintenta la misma solicitud/i);
});

test('createOrder recovers the winner when a concurrent idempotent insert reports duplicate key', async t => {
  configureSandbox(t);
  const originalFindOne = Order.findOne;
  const originalStartSession = mongoose.startSession;
  t.after(() => {
    Order.findOne = originalFindOne;
    mongoose.startSession = originalStartSession;
  });

  const existingOrder = { _id: 'existing-winner', paymentStatus: 'PENDING' };
  let lookupCalls = 0;
  Order.findOne = async () => {
    lookupCalls += 1;
    return lookupCalls === 1 ? null : existingOrder;
  };
  mongoose.startSession = async () => ({
    withTransaction: async () => { throw Object.assign(new Error('duplicate idempotency key'), { code: 11000 }); },
    endSession: async () => {}
  });

  const key = 'request-key-concurrent-123456';
  const response = createResponse();
  await createOrder({
    user: { _id: validId, role: 'user' },
    get: name => name === 'Idempotency-Key' ? key : undefined,
    body: validOrderBody()
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.order, existingOrder);
  assert.equal(lookupCalls, 2);
});

const makeSession = () => ({
  withTransaction: async callback => callback(),
  endSession: async () => {}
});

test('manual approval requires an operation reference and a review note', async t => {
  const originalStartSession = mongoose.startSession;
  t.after(() => { mongoose.startSession = originalStartSession; });
  let sessionCalls = 0;
  mongoose.startSession = async () => { sessionCalls += 1; return makeSession(); };
  const response = createResponse();

  await reviewManualPayment({
    params: { id: validId },
    user: { role: 'admin', _id: 'admin-id' },
    body: { decision: 'approve', reference: '', note: 'Checked the transfer' }
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(sessionCalls, 0);
});

test('admin can approve a manually verified ElectroVibe Pay payment and audit the decision', async t => {
  const originalFindById = Order.findById;
  const originalStartSession = mongoose.startSession;
  t.after(() => {
    Order.findById = originalFindById;
    mongoose.startSession = originalStartSession;
  });
  const order = makeOrder({
    paymentMethod: 'Pago pendiente de coordinación',
    paymentStatus: 'PENDING',
    paymentConfirmed: false,
    status: 'Pendiente',
    products: []
  });
  Order.findById = () => ({ session: async () => order });
  mongoose.startSession = async () => makeSession();
  const response = createResponse();

  await reviewManualPayment({
    params: { id: validId },
    user: { role: 'admin', _id: 'admin-id', email: 'admin@example.test' },
    body: {
      decision: 'approve',
      reference: 'TRX-20261029-123',
      note: 'Abono verificado en cuenta receptora.'
    }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(order.paymentStatus, 'APPROVED');
  assert.equal(order.paymentConfirmed, true);
  assert.equal(order.status, 'Procesando');
  assert.equal(order.manualPaymentReference, 'TRX-20261029-123');
  assert.equal(order.paymentReviewedBy, 'admin@example.test');
  assert.equal(order.paymentReviewNote, 'Abono verificado en cuenta receptora.');
  assert.ok(order.paymentReviewedAt instanceof Date);
  assert.equal(order.saved, true);
});

test('admin rejection cancels the order and restores reserved inventory', async t => {
  const originalFindById = Order.findById;
  const originalStartSession = mongoose.startSession;
  const originalProductUpdateOne = Product.updateOne;
  t.after(() => {
    Order.findById = originalFindById;
    mongoose.startSession = originalStartSession;
    Product.updateOne = originalProductUpdateOne;
  });
  const order = makeOrder({
    paymentMethod: 'Pago pendiente de coordinación',
    paymentStatus: 'PENDING',
    paymentConfirmed: false,
    status: 'Pendiente',
    products: [{ productId: validId, quantity: 2 }]
  });
  Order.findById = () => ({ session: async () => order });
  mongoose.startSession = async () => makeSession();
  const restored = [];
  Product.updateOne = async (...args) => { restored.push(args); return { matchedCount: 1 }; };
  const response = createResponse();

  await reviewManualPayment({
    params: { id: validId },
    user: { role: 'admin', _id: 'admin-id', email: 'admin@example.test' },
    body: { decision: 'reject', reference: 'TRX-REJECT-123', note: 'No matching credit found.' }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(order.paymentStatus, 'DECLINED');
  assert.equal(order.paymentConfirmed, false);
  assert.equal(order.status, 'Cancelado');
  assert.equal(order.paymentReviewNote, 'No matching credit found.');
  assert.equal(restored.length, 1);
  assert.equal(restored[0][1].$inc.quantity, 2);
  assert.equal(order.saved, true);
});

test('customers cannot call the manual payment review controller', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  let queryCalls = 0;
  Order.findById = async () => { queryCalls += 1; };
  const response = createResponse();
  await reviewManualPayment({
    params: { id: validId },
    user: { role: 'user', _id: 'customer-id' },
    body: { decision: 'approve', reference: 'TRX-20261029-123', note: 'Abono verificado.' }
  }, response);
  assert.equal(response.statusCode, 403);
  assert.equal(queryCalls, 0);
});
