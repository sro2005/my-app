const assert = require('node:assert/strict');

const baseUrl = process.env.E2E_API_URL || 'http://127.0.0.1:5001';

async function request(route, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
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

  console.log('HTTP E2E passed: registration, login, profile read/update/reload persistence, role protection, and cross-account authorization. Writes were confined to the disposable CI MongoDB service.');
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
