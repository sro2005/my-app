const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');

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

  const ordersForFirstUser = await request('/api/orders/my-orders', { token });
  expectStatus(ordersForFirstUser, 200, 'Authenticated order history');
  assert.equal(ordersForFirstUser.body.length, 1);
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

  console.log('HTTP E2E passed: registration/login/profile persistence, role and cross-account security, transactional order creation, stock decrement, insufficient-stock rejection, idempotency, and per-user order isolation. Writes stayed in the disposable CI MongoDB replica set.');
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
