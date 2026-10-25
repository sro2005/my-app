const test = require('node:test');
const assert = require('node:assert/strict');
const Order = require('../models/Order');
const { createCheckout, handleWebhook } = require('./wompiController');
const { calculateEventChecksum, calculateIntegritySignature } = require('../utils/wompiSecurity');

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

test('createCheckout refuses administrator accounts before reading an order', async () => {
  const originalFindById = Order.findById;
  let calls = 0;
  Order.findById = async () => { calls += 1; return null; };
  try {
    const response = createResponse();
    await createCheckout({
      params: { id: validId },
      user: { _id: validId, role: 'admin' }
    }, response);

    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /cuentas de cliente/i);
    assert.equal(calls, 0);
  } finally {
    Order.findById = originalFindById;
  }
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
    paymentMethod: 'Wompi',
    paymentStatus: 'PENDING',
    paymentConfirmed: false,
    totalAmount: 100000
  });

  const response = createResponse();
  await createCheckout({ params: { id: validId }, user: { _id: validId, role: 'user' } }, response);

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.checkoutUrl, undefined);
});


const sandboxEnvNames = ['WOMPI_PUBLIC_KEY', 'WOMPI_INTEGRITY_SECRET', 'WOMPI_EVENTS_SECRET'];
const configureSandbox = t => {
  const oldEnv = Object.fromEntries(sandboxEnvNames.map(name => [name, process.env[name]]));
  process.env.WOMPI_PUBLIC_KEY = 'pub_test_unit-test';
  process.env.WOMPI_INTEGRITY_SECRET = 'test_integrity_unit-test';
  process.env.WOMPI_EVENTS_SECRET = 'test_events_unit-test';
  t.after(() => {
    for (const name of sandboxEnvNames) {
      if (oldEnv[name] === undefined) delete process.env[name];
      else process.env[name] = oldEnv[name];
    }
  });
};

const buildSignedEvent = (transaction, secret = 'test_events_unit-test') => {
  const event = {
    event: 'transaction.updated',
    timestamp: 1720000000,
    signature: {
      properties: [
        'transaction.id',
        'transaction.status',
        'transaction.amount_in_cents',
        'transaction.currency',
        'transaction.reference'
      ],
      checksum: ''
    },
    data: { transaction }
  };
  event.signature.checksum = calculateEventChecksum(event, secret);
  return event;
};

test('handleWebhook rejects an invalid event checksum before looking up the order', async t => {
  configureSandbox(t);
  const originalFindOne = Order.findOne;
  t.after(() => { Order.findOne = originalFindOne; });
  let lookups = 0;
  Order.findOne = async () => { lookups += 1; return null; };

  const event = buildSignedEvent({
    id: 'TX-100',
    status: 'APPROVED',
    amount_in_cents: 12345,
    currency: 'COP',
    reference: 'EVH-unit-test'
  });
  event.signature.checksum = 'bad-checksum';
  const response = createResponse();
  await handleWebhook({ body: event, get: () => undefined }, response);

  assert.equal(response.statusCode, 401);
  assert.equal(lookups, 0);
});

test('handleWebhook rejects amounts that do not match the order', async t => {
  configureSandbox(t);
  const originalFindOne = Order.findOne;
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  t.after(() => {
    Order.findOne = originalFindOne;
    Order.findOneAndUpdate = originalFindOneAndUpdate;
  });

  let updates = 0;
  Order.findOne = async () => ({
    _id: validId,
    paymentReference: 'EVH-unit-test',
    totalAmount: 123.45,
    paymentStatus: 'PENDING',
    paymentConfirmed: false,
    status: 'Pendiente'
  });
  Order.findOneAndUpdate = async () => { updates += 1; return null; };

  const event = buildSignedEvent({
    id: 'TX-101',
    status: 'APPROVED',
    amount_in_cents: 99999,
    currency: 'COP',
    reference: 'EVH-unit-test'
  });
  const response = createResponse();
  await handleWebhook({ body: event, get: () => undefined }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(updates, 0);
});

test('handleWebhook confirms a correctly signed approval with matching amount and currency', async t => {
  configureSandbox(t);
  const originalFindOne = Order.findOne;
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  t.after(() => {
    Order.findOne = originalFindOne;
    Order.findOneAndUpdate = originalFindOneAndUpdate;
  });

  const order = {
    _id: validId,
    paymentReference: 'EVH-unit-test',
    totalAmount: 123.45,
    paymentStatus: 'PENDING',
    paymentConfirmed: false,
    status: 'Pendiente'
  };
  let received;
  Order.findOne = async () => order;
  Order.findOneAndUpdate = async (filter, update, options) => {
    received = { filter, update, options };
    return { ...order, paymentStatus: 'APPROVED', paymentConfirmed: true, status: 'Procesando' };
  };

  const event = buildSignedEvent({
    id: 'TX-102',
    status: 'APPROVED',
    amount_in_cents: 12345,
    currency: 'COP',
    reference: 'EVH-unit-test'
  });
  const response = createResponse();
  await handleWebhook({ body: event, get: () => undefined }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(received.filter.paymentStatus, 'PENDING');
  assert.equal(received.filter.paymentConfirmed, false);
  assert.equal(received.update.$set.paymentStatus, 'APPROVED');
  assert.equal(received.update.$set.paymentConfirmed, true);
  assert.equal(received.update.$set.paymentTransactionId, 'TX-102');
  assert.equal(received.update.$set.status, 'Procesando');
  assert.equal(received.options.runValidators, true);
});

test('handleWebhook ignores a repeated event after the order is no longer pending', async t => {
  configureSandbox(t);
  const originalFindOne = Order.findOne;
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  t.after(() => {
    Order.findOne = originalFindOne;
    Order.findOneAndUpdate = originalFindOneAndUpdate;
  });

  let updates = 0;
  Order.findOne = async () => ({
    _id: validId,
    paymentReference: 'EVH-unit-test',
    totalAmount: 123.45,
    paymentStatus: 'APPROVED',
    paymentConfirmed: true,
    status: 'Procesando'
  });
  Order.findOneAndUpdate = async () => { updates += 1; return null; };

  const event = buildSignedEvent({
    id: 'TX-102',
    status: 'APPROVED',
    amount_in_cents: 12345,
    currency: 'COP',
    reference: 'EVH-unit-test'
  });
  const response = createResponse();
  await handleWebhook({ body: event, get: () => undefined }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ignored, true);
  assert.equal(updates, 0);
});


test('createCheckout emits a signed Sandbox checkout and records when checkout starts', async t => {
  const originals = {
    findById: Order.findById,
    findOneAndUpdate: Order.findOneAndUpdate
  };
  const envNames = ['WOMPI_PUBLIC_KEY', 'WOMPI_INTEGRITY_SECRET', 'WOMPI_EVENTS_SECRET', 'FRONTEND_URL'];
  const oldEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
  t.after(() => {
    Order.findById = originals.findById;
    Order.findOneAndUpdate = originals.findOneAndUpdate;
    for (const name of envNames) {
      if (oldEnv[name] === undefined) delete process.env[name];
      else process.env[name] = oldEnv[name];
    }
  });

  process.env.WOMPI_PUBLIC_KEY = 'pub_test_unit-test';
  process.env.WOMPI_INTEGRITY_SECRET = 'test_integrity_unit-test';
  process.env.WOMPI_EVENTS_SECRET = 'test_events_unit-test';
  process.env.FRONTEND_URL = 'https://preview.example.test';

  const order = {
    _id: validId,
    userId: validId,
    status: 'Pendiente',
    paymentMethod: 'Wompi',
    paymentStatus: 'PENDING',
    paymentConfirmed: false,
    totalAmount: 123.45,
    paymentReference: 'EVH-unit-order',
    orderDate: new Date()
  };
  let savedUpdate;
  let savedFilter;
  let savedOptions;
  Order.findById = async () => order;
  Order.findOneAndUpdate = async (filter, update, options) => {
    savedFilter = filter;
    savedUpdate = update;
    savedOptions = options;
    return { ...order, ...update.$set };
  };

  const response = createResponse();
  await createCheckout({
    params: { id: validId },
    user: { _id: validId, role: 'user' }
  }, response);

  assert.equal(response.statusCode, 200);
  const checkoutUrl = new URL(response.body.checkoutUrl);
  assert.equal(checkoutUrl.origin + checkoutUrl.pathname, 'https://checkout.wompi.co/p/');
  assert.equal(checkoutUrl.searchParams.get('public-key'), 'pub_test_unit-test');
  assert.equal(checkoutUrl.searchParams.get('currency'), 'COP');
  assert.equal(checkoutUrl.searchParams.get('amount-in-cents'), '12345');
  assert.equal(checkoutUrl.searchParams.get('reference'), 'EVH-unit-order');
  assert.equal(
    checkoutUrl.searchParams.get('signature:integrity'),
    calculateIntegritySignature('EVH-unit-order', 12345, 'COP', 'test_integrity_unit-test')
  );
  assert.equal(checkoutUrl.searchParams.get('redirect-url'), 'https://preview.example.test/pago-resultado');
  assert.equal(response.body.reference, 'EVH-unit-order');
  assert.equal(savedFilter.paymentStatus, 'PENDING');
  assert.equal(savedFilter.paymentReference, 'EVH-unit-order');
  assert.ok(savedUpdate.$set.checkoutStartedAt instanceof Date);
  assert.equal(savedOptions.runValidators, true);
});

test('createCheckout returns a restartable result for an already expired Sandbox order', async t => {
  const originalFindById = Order.findById;
  t.after(() => { Order.findById = originalFindById; });
  Order.findById = async () => ({
    _id: validId,
    userId: validId,
    status: 'Cancelado',
    paymentMethod: 'Wompi',
    paymentStatus: 'EXPIRED',
    paymentConfirmed: false,
    totalAmount: 123.45,
    orderDate: new Date(Date.now() - 60 * 60 * 1000)
  });

  const response = createResponse();
  await createCheckout({
    params: { id: validId },
    user: { _id: validId, role: 'user' }
  }, response);

  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, 'WOMPI_CHECKOUT_EXPIRED');
  assert.match(response.body.message, /confirma un nuevo pedido/i);
});


test('ignores a correctly signed late approval after a Wompi order expired', async t => {
  configureSandbox(t);
  const originals = {
    findOne: Order.findOne,
    findOneAndUpdate: Order.findOneAndUpdate
  };
  t.after(() => {
    Order.findOne = originals.findOne;
    Order.findOneAndUpdate = originals.findOneAndUpdate;
  });

  let updates = 0;
  Order.findOne = async () => ({
    _id: validId,
    paymentReference: 'EVH-expired-order',
    totalAmount: 123.45,
    paymentStatus: 'EXPIRED',
    paymentConfirmed: false,
    status: 'Cancelado'
  });
  Order.findOneAndUpdate = async () => { updates += 1; return null; };

  const event = buildSignedEvent({
    id: 'TX-LATE-APPROVAL',
    status: 'APPROVED',
    amount_in_cents: 12345,
    currency: 'COP',
    reference: 'EVH-expired-order'
  });
  const response = createResponse();
  await handleWebhook({ body: event, get: () => undefined }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ignored, true);
  assert.equal(updates, 0);
});
