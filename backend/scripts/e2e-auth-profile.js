const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { calculateEventChecksum } = require('../utils/wompiSecurity');

const wompiSignedProperties = [
  'transaction.id',
  'transaction.status',
  'transaction.amount_in_cents',
  'transaction.currency',
  'transaction.reference'
];

function createSignedWompiEvent(transaction) {
  const event = {
    event: 'transaction.updated',
    timestamp: Math.floor(Date.now() / 1000),
    signature: { properties: wompiSignedProperties, checksum: '' },
    data: { transaction }
  };
  event.signature.checksum = calculateEventChecksum(event, process.env.WOMPI_EVENTS_SECRET);
  return event;
}

const baseUrl = process.env.E2E_API_URL || 'http://127.0.0.1:5001';

async function request(route, { method = 'GET', token, body, idempotencyKey } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000)
  });
  const text = await response.text();
  let payload = text;
  try { payload = text ? JSON.parse(text) : null; } catch {}
  return { status: response.status, body: payload };
}

function expectStatus(result, expected, name) {
  assert.equal(result.status, expected,
    `${name}: expected HTTP ${expected}, got ${result.status}: ${JSON.stringify(result.body)}`);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const suffix = String(Date.now()).slice(-9);
  const idNumber = suffix.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const email = `ci-e2e-${Date.now()}@example.com`;
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: {
      firstName: 'CI E2E',
      lastName: 'Customer',
      email: email.toUpperCase(),
      identificationNumber: idNumber,
      birthDate: '1990-01-01',
      phone: '3001234567',
      preferences: ['Audio'],
      password: 'StrongPass1!',
      role: 'admin'
    }
  });
  expectStatus(registration, 201, 'Registration');
  
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'StrongPass1!', role: 'user' }
  });
  expectStatus(login, 200, 'Login');
  assert.equal(login.body.user.role, 'user', 'Public registration must not grant admin access');
  assert.equal(typeof login.body.token, 'string');
  const token = login.body.token;
  const customerId = login.body.user._id;

  const profile = await request('/api/customers/profile', { token });
  expectStatus(profile, 200, 'Initial profile read');
  assert.equal(profile.body.email, email);
  assert.deepEqual(profile.body.preferences, ['Audio']);
  assert.doesNotMatch(JSON.stringify(profile.body), /password|resetPasswordToken|resetPasswordExpires/);

  const update = await request(`/api/customers/${customerId}`, {
    method: 'PUT',
    token,
    body: {
      firstName: 'CI E2E Updated',
      preferences: ['Audio', 'Televisores'],
      role: 'admin',
      password: 'InjectedPassword1!'
    }
  });
  expectStatus(update, 200, 'Profile update');
  assert.equal(update.body.updatedCustomer.firstName, 'CI E2E Updated');
  assert.equal(update.body.updatedCustomer.role, 'user');

  const reloaded = await request('/api/customers/profile', { token });
  expectStatus(reloaded, 200, 'Persisted profile reload');
  assert.equal(reloaded.body.firstName, 'CI E2E Updated');
  assert.deepEqual(reloaded.body.preferences, ['Audio', 'Televisores']);
  assert.equal(reloaded.body.role, 'user');

  const forbidden = await request('/api/customers/507f1f77bcf86cd799439012', {
    method: 'PUT',
    token,
    body: { firstName: 'Unauthorized Change' }
  });
  expectStatus(forbidden, 403, 'Cross-account profile update');


  // Product fixtures are kept only in the disposable CI replica set.
  const fixtureTag = Date.now();
  const purchasableProduct = await Product.create({
    name: 'CI E2E Transaction Product ' + fixtureTag,
    description: 'Disposable product for transactional order testing',
    category: 'CI E2E',
    price: 12345,
    quantity: 5,
    demo: true,
    demoIcon: 'test',
    catalogVersion: 'e2e'
  });
  const lowStockProduct = await Product.create({
    name: 'CI E2E Low Stock Product ' + fixtureTag,
    description: 'Disposable low-stock product for negative-path testing',
    category: 'CI E2E',
    price: 9999,
    quantity: 1,
    demo: true,
    demoIcon: 'test',
    catalogVersion: 'e2e'
  });

  const orderBody = {
    firstName: 'CI E2E',
    lastName: 'Customer',
    email,
    phone: '+57 300 123 4567',
    address: 'Calle 123 # 45-67, Bogotá',
    paymentMethod: 'Wompi',
    deliveryDate: '2099-01-01',
    products: [{ productId: purchasableProduct._id.toString(), quantity: 2 }]
  };
  const idempotencyKey = 'ci-e2e-order-' + fixtureTag + '-first';
  const placedOrder = await request('/api/orders/realizar', {
    method: 'POST',
    token,
    body: orderBody,
    idempotencyKey
  });
  expectStatus(placedOrder, 201, 'Transactional order creation');
  assert.equal(placedOrder.body.order.totalAmount, 24690, 'Order total must be calculated from server-side prices');
  const firstOrderId = placedOrder.body.order._id;
  let persistedStock = await Product.findById(purchasableProduct._id);
  assert.equal(persistedStock.quantity, 3, 'Creating an order must decrement stock exactly once');

  const repeatedOrder = await request('/api/orders/realizar', {
    method: 'POST',
    token,
    body: orderBody,
    idempotencyKey
  });
  expectStatus(repeatedOrder, 200, 'Repeated idempotency key');
  assert.equal(repeatedOrder.body.order._id, firstOrderId, 'Repeated request should return the same order');
  persistedStock = await Product.findById(purchasableProduct._id);
  assert.equal(persistedStock.quantity, 3, 'A repeated request must not reserve stock twice');

  const stockConflict = await request('/api/orders/realizar', {
    method: 'POST',
    token,
    body: {
      ...orderBody,
      products: [{ productId: lowStockProduct._id.toString(), quantity: 2 }]
    },
    idempotencyKey: 'ci-e2e-order-' + fixtureTag + '-insufficient'
  });
  expectStatus(stockConflict, 409, 'Insufficient stock');
  assert.match(stockConflict.body.message, /stock|disponibles/i);
  const persistedLowStock = await Product.findById(lowStockProduct._id);
  assert.equal(persistedLowStock.quantity, 1, 'Insufficient stock must leave inventory unchanged');
  assert.equal(await Order.countDocuments({ userId: customerId }), 1, 'Insufficient stock must not persist a second order');


  // The checkout URL is only inspected; this test never visits Wompi or starts a real transaction.
  const checkout = await request('/api/orders/' + firstOrderId + '/wompi-checkout', {
    method: 'POST',
    token
  });
  expectStatus(checkout, 200, 'Wompi sandbox checkout creation');
  const checkoutUrl = new URL(checkout.body.checkoutUrl);
  assert.equal(checkoutUrl.origin, 'https://checkout.wompi.co');
  assert.equal(checkoutUrl.searchParams.get('public-key'), process.env.WOMPI_PUBLIC_KEY);
  assert.equal(checkoutUrl.searchParams.get('currency'), 'COP');
  assert.equal(checkoutUrl.searchParams.get('amount-in-cents'), '2469000');
  assert.equal(checkout.body.amountInCents, 2469000);
  assert.equal(checkout.body.currency, 'COP');
  const orderWithReference = await Order.findById(firstOrderId);
  assert.equal(orderWithReference.paymentReference, checkout.body.reference, 'Checkout reference must persist on the order');

  const repeatedCheckout = await request('/api/orders/' + firstOrderId + '/wompi-checkout', {
    method: 'POST',
    token
  });
  expectStatus(repeatedCheckout, 200, 'Repeated checkout request');
  assert.equal(repeatedCheckout.body.reference, checkout.body.reference, 'Repeated checkout must reuse the same payment reference');

  const approvedTransaction = {
    id: 'CI-APPROVED-' + fixtureTag,
    status: 'APPROVED',
    amount_in_cents: 2469000,
    currency: 'COP',
    reference: checkout.body.reference
  };
  const badSignatureEvent = createSignedWompiEvent(approvedTransaction);
  badSignatureEvent.signature.checksum = 'invalid-ci-checksum';
  const badSignatureResponse = await request('/api/orders/wompi/webhook', {
    method: 'POST',
    body: badSignatureEvent
  });
  expectStatus(badSignatureResponse, 401, 'Invalid Wompi webhook signature');
  const orderAfterBadSignature = await Order.findById(firstOrderId);
  assert.equal(orderAfterBadSignature.paymentStatus, 'PENDING', 'Invalid signature must not change payment state');

  const approvalEvent = createSignedWompiEvent(approvedTransaction);
  const approvalResponse = await request('/api/orders/wompi/webhook', {
    method: 'POST',
    body: approvalEvent
  });
  expectStatus(approvalResponse, 200, 'Valid Wompi approval webhook');
  const approvedOrder = await Order.findById(firstOrderId);
  assert.equal(approvedOrder.paymentStatus, 'APPROVED');
  assert.equal(approvedOrder.paymentConfirmed, true);
  assert.equal(approvedOrder.status, 'Procesando');

  const duplicateApprovalResponse = await request('/api/orders/wompi/webhook', {
    method: 'POST',
    body: approvalEvent
  });
  expectStatus(duplicateApprovalResponse, 200, 'Repeated approval webhook');
  assert.equal(duplicateApprovalResponse.body.ignored, true);
  persistedStock = await Product.findById(purchasableProduct._id);
  assert.equal(persistedStock.quantity, 3, 'Repeated approval events must not alter stock again');

  // A sandbox DECLINED event must cancel the second pending order and restore its reservation only once.
  const declineOrderBody = {
    ...orderBody,
    products: [{ productId: purchasableProduct._id.toString(), quantity: 2 }]
  };
  const declineOrderResponse = await request('/api/orders/realizar', {
    method: 'POST',
    token,
    body: declineOrderBody,
    idempotencyKey: 'ci-e2e-order-' + fixtureTag + '-declined'
  });
  expectStatus(declineOrderResponse, 201, 'Second order for declined-payment inventory test');
  const declineOrderId = declineOrderResponse.body.order._id;
  persistedStock = await Product.findById(purchasableProduct._id);
  assert.equal(persistedStock.quantity, 1, 'Second order should reserve two remaining units');

  const declineCheckout = await request('/api/orders/' + declineOrderId + '/wompi-checkout', {
    method: 'POST',
    token
  });
  expectStatus(declineCheckout, 200, 'Checkout for declined-payment inventory test');
  const declinedTransaction = {
    id: 'CI-DECLINED-' + fixtureTag,
    status: 'DECLINED',
    amount_in_cents: 2469000,
    currency: 'COP',
    reference: declineCheckout.body.reference
  };
  const declineEvent = createSignedWompiEvent(declinedTransaction);
  const declineResponse = await request('/api/orders/wompi/webhook', {
    method: 'POST',
    body: declineEvent
  });
  expectStatus(declineResponse, 200, 'Valid Wompi declined webhook');
  const cancelledOrder = await Order.findById(declineOrderId);
  assert.equal(cancelledOrder.paymentStatus, 'DECLINED');
  assert.equal(cancelledOrder.status, 'Cancelado');
  persistedStock = await Product.findById(purchasableProduct._id);
  assert.equal(persistedStock.quantity, 3, 'Declined payment must restore the reserved inventory');

  const repeatedDeclineResponse = await request('/api/orders/wompi/webhook', {
    method: 'POST',
    body: declineEvent
  });
  expectStatus(repeatedDeclineResponse, 200, 'Repeated declined webhook');
  assert.equal(repeatedDeclineResponse.body.ignored, true);
  persistedStock = await Product.findById(purchasableProduct._id);
  assert.equal(persistedStock.quantity, 3, 'Repeated declined events must not restore stock twice');


  // Submit the same idempotent order twice at once; only one stock reservation may commit.
  const concurrentIdempotentProduct = await Product.create({
    name: 'CI E2E Concurrent Idempotency Product ' + fixtureTag,
    description: 'Disposable product for concurrent idempotency testing',
    category: 'CI E2E',
    price: 6789,
    quantity: 5,
    demo: true,
    demoIcon: 'test',
    catalogVersion: 'e2e'
  });
  const concurrentIdempotentBody = {
    ...orderBody,
    products: [{ productId: concurrentIdempotentProduct._id.toString(), quantity: 1 }]
  };
  const concurrentIdempotencyKey = 'ci-e2e-order-' + fixtureTag + '-parallel';
  const concurrentIdempotentResults = await Promise.all([
    request('/api/orders/realizar', {
      method: 'POST',
      token,
      body: concurrentIdempotentBody,
      idempotencyKey: concurrentIdempotencyKey
    }),
    request('/api/orders/realizar', {
      method: 'POST',
      token,
      body: concurrentIdempotentBody,
      idempotencyKey: concurrentIdempotencyKey
    })
  ]);
  assert.deepEqual(
    concurrentIdempotentResults.map(result => result.status).sort((a, b) => a - b),
    [200, 201],
    'Concurrent calls with the same key should resolve to one creation and one reuse'
  );
  assert.equal(
    new Set(concurrentIdempotentResults.map(result => result.body.order._id)).size,
    1,
    'Concurrent idempotent calls must return the same order'
  );
  const concurrentIdempotentStock = await Product.findById(concurrentIdempotentProduct._id);
  assert.equal(concurrentIdempotentStock.quantity, 4, 'Concurrent idempotent calls must reserve exactly one unit');

  // Two different requests competing for 3 units at quantity 2 must not oversell.
  const scarceProduct = await Product.create({
    name: 'CI E2E Concurrent Stock Product ' + fixtureTag,
    description: 'Disposable product for concurrent stock reservation testing',
    category: 'CI E2E',
    price: 7777,
    quantity: 3,
    demo: true,
    demoIcon: 'test',
    catalogVersion: 'e2e'
  });
  const scarceOrderBody = {
    ...orderBody,
    products: [{ productId: scarceProduct._id.toString(), quantity: 2 }]
  };
  const concurrentStockResults = await Promise.all([
    request('/api/orders/realizar', {
      method: 'POST',
      token,
      body: scarceOrderBody,
      idempotencyKey: 'ci-e2e-order-' + fixtureTag + '-stock-a'
    }),
    request('/api/orders/realizar', {
      method: 'POST',
      token,
      body: scarceOrderBody,
      idempotencyKey: 'ci-e2e-order-' + fixtureTag + '-stock-b'
    })
  ]);
  assert.deepEqual(
    concurrentStockResults.map(result => result.status).sort((a, b) => a - b),
    [201, 409],
    'Only one concurrent order can reserve two units from a stock of three'
  );
  const scarceStockAfterRace = await Product.findById(scarceProduct._id);
  assert.equal(scarceStockAfterRace.quantity, 1, 'Concurrent stock race must not oversell or double-decrement');
  assert.equal(await Order.countDocuments({ userId: customerId }), 4, 'Only four successful orders should persist for the primary test customer');

  const ordersForFirstUser = await request('/api/orders/my-orders', { token });
  expectStatus(ordersForFirstUser, 200, 'Authenticated order history');
  assert.equal(ordersForFirstUser.body.length, 4, 'Only the four successful order creations should appear in the history');
  assert.equal(ordersForFirstUser.body[0]._id, firstOrderId);
  const adminListForbidden = await request('/api/orders/all', { token });
  expectStatus(adminListForbidden, 403, 'Non-admin order listing');

  const otherDigits = String((Number(suffix) + 1) % 1000000000).padStart(9, '0');
  const otherEmail = 'ci-e2e-other-' + fixtureTag + '@example.com';
  const otherRegistration = await request('/api/auth/register', {
    method: 'POST',
    body: {
      firstName: 'CI E2E Other',
      lastName: 'Customer',
      email: otherEmail,
      identificationNumber: otherDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      birthDate: '1990-01-01',
      phone: '3001234568',
      preferences: ['Audio'],
      password: 'StrongPass1!'
    }
  });
  expectStatus(otherRegistration, 201, 'Second customer registration');
  const otherLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: otherEmail, password: 'StrongPass1!', role: 'user' }
  });
  expectStatus(otherLogin, 200, 'Second customer login');
  const otherOrderHistory = await request('/api/orders/my-orders', { token: otherLogin.body.token });
  expectStatus(otherOrderHistory, 200, 'Second customer order history');
  assert.deepEqual(otherOrderHistory.body, [], 'One customer must not see another customer orders');


  // Test the real HTTP password-reset flow with a known token stored only as a hash.
  const recoveryToken = crypto.randomBytes(32).toString('hex');
  await Customer.updateOne(
    { _id: customerId },
    {
      $set: {
        resetPasswordToken: crypto.createHash('sha256').update(recoveryToken).digest('hex'),
        resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000)
      }
    }
  );
  const resetResponse = await request('/api/customers/reset-password/' + recoveryToken, {
    method: 'POST',
    body: { password: 'RenewedPass2!' }
  });
  expectStatus(resetResponse, 200, 'Valid password reset');
  assert.match(resetResponse.body.message, /Contraseña actualizada/i);

  const reusedTokenResponse = await request('/api/customers/reset-password/' + recoveryToken, {
    method: 'POST',
    body: { password: 'AnotherPass3!' }
  });
  expectStatus(reusedTokenResponse, 400, 'Reused password-reset token');

  const oldPasswordLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'StrongPass1!', role: 'user' }
  });
  expectStatus(oldPasswordLogin, 401, 'Old password after reset');
  const renewedPasswordLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'RenewedPass2!', role: 'user' }
  });
  expectStatus(renewedPasswordLogin, 200, 'New password after reset');

  const expiredRecoveryToken = 'e'.repeat(64);
  await Customer.updateOne(
    { _id: customerId },
    {
      $set: {
        resetPasswordToken: crypto.createHash('sha256').update(expiredRecoveryToken).digest('hex'),
        resetPasswordExpires: new Date(Date.now() - 1000)
      }
    }
  );
  const expiredResetResponse = await request('/api/customers/reset-password/' + expiredRecoveryToken, {
    method: 'POST',
    body: { password: 'ExpiredPass4!' }
  });
  expectStatus(expiredResetResponse, 400, 'Expired password-reset token');

  console.log('HTTP E2E passed: registration/login/profile persistence, authorization, transactional orders, stock decrement and insufficient-stock rejection, idempotency, per-user order isolation, concurrent idempotency and stock-race protection, Wompi sandbox checkout signatures, approved/declined webhooks, duplicate events, inventory restoration, password reset/token expiry and reuse protection. All writes stayed in the disposable CI MongoDB replica set; no external payment was initiated.');
}

main()
  .catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect().catch(error => {
    console.error('Could not close disposable E2E MongoDB connection:', error.message);
    process.exitCode = 1;
  }));
