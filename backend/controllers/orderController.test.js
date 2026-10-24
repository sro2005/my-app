const test = require('node:test');
const assert = require('node:assert/strict');
const Order = require('../models/Order');
const { updateOrderStatusAutomatically } = require('./orderController');

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
