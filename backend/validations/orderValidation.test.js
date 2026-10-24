const test = require('node:test');
const assert = require('node:assert/strict');
const moment = require('moment-timezone');
const { orderSchema, deliveryDateSchema } = require('./orderValidation');

const todayInBogota = () => moment.tz('America/Bogota').format('YYYY-MM-DD');

const validOrder = {
  firstName: 'Cliente',
  lastName: 'Demo',
  email: 'cliente@example.com',
  phone: '+57 300 123 4567',
  address: 'Calle 10 # 20-30, Bogotá',
  paymentMethod: 'Wompi',
  deliveryDate: todayInBogota(),
  products: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
  userId: '507f1f77bcf86cd799439012'
};

test('acepta un pedido válido con entrega hoy en la zona horaria de Colombia', () => {
  const { error } = orderSchema.validate(validOrder);
  assert.equal(error, undefined);
});

test('acepta cantidades enteras positivas y varios productos', () => {
  const { error } = orderSchema.validate({
    ...validOrder,
    products: [
      { productId: '507f1f77bcf86cd799439011', quantity: 2 },
      { productId: '507f1f77bcf86cd799439013', quantity: 5 }
    ]
  });
  assert.equal(error, undefined);
});

test('rechaza pedido sin productos o con cantidad no válida', () => {
  for (const changes of [
    { products: [] },
    { products: [{ productId: '507f1f77bcf86cd799439011', quantity: 0 }] },
    { products: [{ productId: '507f1f77bcf86cd799439011', quantity: -1 }] },
    { products: [{ productId: '507f1f77bcf86cd799439011', quantity: 1.5 }] },
    { products: [{ productId: 'invalid-id', quantity: 1 }] }
  ]) {
    assert.ok(orderSchema.validate({ ...validOrder, ...changes }).error, JSON.stringify(changes));
  }
});

test('acepta el método de pago de demostración sin proveedor externo', () => {
  const { error } = orderSchema.validate({ ...validOrder, paymentMethod: 'Demostración' });
  assert.equal(error, undefined);
});

test('rechaza método de pago diferente al permitido', () => {
  assert.ok(orderSchema.validate({ ...validOrder, paymentMethod: 'Transferencia' }).error);
});

test('rechaza datos de contacto obligatorios vacíos o correo inválido', () => {
  for (const changes of [
    { firstName: '' },
    { lastName: '' },
    { email: 'correo-invalido' },
    { phone: '' },
    { address: '' }
  ]) {
    assert.ok(orderSchema.validate({ ...validOrder, ...changes }).error, JSON.stringify(changes));
  }
});

test('rechaza fecha de entrega anterior al día actual en Colombia', () => {
  const yesterday = moment.tz('America/Bogota').subtract(1, 'day').format('YYYY-MM-DD');
  assert.ok(orderSchema.validate({ ...validOrder, deliveryDate: yesterday }).error);
});

test('requiere identificadores válidos de usuario y producto', () => {
  assert.ok(orderSchema.validate({ ...validOrder, userId: 'no-es-id' }).error);
  assert.ok(orderSchema.validate({
    ...validOrder,
    products: [{ productId: 'no-es-id', quantity: 1 }]
  }).error);
});


test('valida fechas de calendario sin conversión a UTC para la edición logística', () => {
  const today = todayInBogota();
  assert.equal(deliveryDateSchema.validate(today).error, undefined);
  assert.equal(deliveryDateSchema.validate(today).value, today);
  assert.ok(deliveryDateSchema.validate('2026-02-30').error);
  assert.ok(deliveryDateSchema.validate('fecha-inválida').error);
  const yesterday = moment.tz('America/Bogota').subtract(1, 'day').format('YYYY-MM-DD');
  assert.ok(deliveryDateSchema.validate(yesterday).error);
});
