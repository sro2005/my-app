const test = require('node:test');
const assert = require('node:assert/strict');
const { productSchema } = require('./productValidation');

const validProduct = {
  name: 'Refrigerador',
  description: 'Refrigerador de bajo consumo',
  category: 'Refrigeración',
  price: 1250000,
  quantity: 8,
  imageUrl: 'https://images.example.com/producto.jpg'
};

test('product schema accepts valid products, zero stock and image URL query strings', () => {
  const result = productSchema.validate({
    ...validProduct,
    quantity: 0,
    imageUrl: 'https://images.example.com/producto.PNG?width=800'
  });

  assert.equal(result.error, undefined);
});

test('product schema trims text before the controller saves it', () => {
  const result = productSchema.validate({
    ...validProduct,
    name: '  Refrigerador  ',
    category: '  Refrigeración  '
  });

  assert.equal(result.error, undefined);
  assert.equal(result.value.name, 'Refrigerador');
  assert.equal(result.value.category, 'Refrigeración');
});

test('product schema rejects blank text and invalid inventory or prices', () => {
  for (const changes of [
    { name: '   ' },
    { description: '' },
    { category: '   ' },
    { price: 0 },
    { price: 0.005 },
    { price: -1 },
    { price: 1.239 },
    { quantity: -1 },
    { quantity: 1.5 }
  ]) {
    assert.ok(productSchema.validate({ ...validProduct, ...changes }).error, JSON.stringify(changes));
  }
});

test('product schema rejects unsupported image protocols, extensions and extra fields', () => {
  for (const changes of [
    { imageUrl: 'javascript:alert(1)' },
    { imageUrl: 'https://user:password@images.example.com/producto.jpg' },
    { imageUrl: 'https://images.example.com/producto.svg' },
    { imageUrl: 'https://images.example.com/producto.png/redirect' },
    { unexpected: true }
  ]) {
    assert.ok(productSchema.validate({ ...validProduct, ...changes }).error, JSON.stringify(changes));
  }
});
