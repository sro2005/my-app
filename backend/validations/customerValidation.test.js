const test = require('node:test');
const assert = require('node:assert/strict');
const { isAdult } = require('../controllers/authController');
const { registerSchema } = require('./customerValidation');

test('registration rejects customers who are not adults', () => {
  const futureBirthDate = new Date();
  futureBirthDate.setFullYear(futureBirthDate.getFullYear() + 1);
  assert.equal(isAdult(futureBirthDate), false);
  assert.equal(isAdult(new Date('2000-01-01T12:00:00.000Z')), true);
  assert.equal(isAdult('2000-01-01'), false);
});

test('registration schema requires identity, contact, email and a strong password', () => {
  const result = registerSchema.validate({
    role: 'user',
    firstName: 'Ana',
    lastName: 'Pérez',
    email: 'ana@example.com',
    identificationNumber: '1.234.567',
    birthDate: '2000-01-01',
    phone: '3001234567',
    preferences: [],
    password: 'StrongPass1!'
  }, { abortEarly: false });
  assert.equal(result.error, undefined);
});

test('registration schema rejects missing required customer fields and weak passwords', () => {
  const result = registerSchema.validate({
    role: 'user',
    email: 'not-an-email',
    password: 'weak'
  }, { abortEarly: false });
  assert.ok(result.error);
  assert.ok(result.error.details.length >= 3);
});


test('registration schema rejects passwords over the configured length limit', () => {
  const result = registerSchema.validate({
    role: 'user',
    firstName: 'Ana',
    lastName: 'Pérez',
    email: 'ana@example.com',
    identificationNumber: '1.234.567',
    birthDate: '2000-01-01',
    phone: '3001234567',
    preferences: [],
    password: 'StrongPass1!' + 'a'.repeat(128)
  });
  assert.ok(result.error);
  assert.ok(result.error.details.some(detail => detail.type === 'string.max'));
});
