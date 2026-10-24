const test = require('node:test');
const assert = require('node:assert/strict');
const Order = require('../models/Order');
const { createCheckout } = require('./wompiController');

const validId = '507f1f77bcf86cd799439011';
const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test('createCheckout rejects malformed order ids before querying MongoDB', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  let calls = 0;
  Order.findById = async () => { calls += 1; };

  const response = createResponse();
  await createCheckout({ params: { id: 'not-an-object-id' }, user: { _id: validId, role: 'user' } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});

test('createCheckout refuses production credentials and never emits a live checkout', async t => {
  const originalFindById = Order.findById;
  const envNames = ['WOMPI_PUBLIC_KEY', 'WOMPI_INTEGRITY_SECRET', 'WOMPI_EVENTS_SECRET', 'FRONTEND_URL'];
  const oldEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
  t.after(() => {
    Order.findById = originalFindById;
    for (const name of envNames) {
      if (oldEnv[name] === undefined) delete process.env[name];
      else process.env[name] = oldEnv[name];
    }
  });

  process.env.WOMPI_PUBLIC_KEY = 'pub_prod_not-real';
  process.env.WOMPI_INTEGRITY_SECRET = 'prod_integrity_not-real';
  process.env.WOMPI_EVENTS_SECRET = 'prod_events_not-real';
  process.env.FRONTEND_URL = 'https://preview.example.test';
  Order.findById = async () => ({
    _id: validId,
    userId: validId,
    status: 'Pendiente',
    paymentStatus: 'PENDING',
    paymentConfirmed: false,
    totalAmount: 100000
  });

  const response = createResponse();
  await createCheckout({ params: { id: validId }, user: { _id: validId, role: 'user' } }, response);

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.checkoutUrl, undefined);
});
