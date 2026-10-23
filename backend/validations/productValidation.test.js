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

test('product schema accepts demo products with an empty image URL and preserves demo metadata', () => {
  const result = productSchema.validate({
    ...validProduct,
    imageUrl: '',
    demo: true,
    demoIcon: '❄️',
    catalogVersion: 'electrovibehome-v2-demo'
  });

  assert.equal(result.error, undefined);
  assert.equal(result.value.imageUrl, '');
  assert.equal(result.value.demo, true);
  assert.equal(result.value.demoIcon, '❄️');
  assert.equal(result.value.catalogVersion, 'electrovibehome-v2-demo');
});

test('product schema accepts regular products without optional demo metadata', () => {
  const result = productSchema.validate(validProduct);
  assert.equal(result.error, undefined);
  assert.equal(Object.hasOwn(result.value, 'demo'), false);
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
    { price: 1000000001 },
    { quantity: -1 },
    { quantity: 1.5 },
    { quantity: 1000001 }
  ]) {
    assert.ok(productSchema.validate({ ...validProduct, ...changes }).error, JSON.stringify(changes));
  }
});

test('product schema rejects unsupported image protocols, extensions and extra fields', () => {
  for (const changes of [
    { imageUrl: 'javascript:alert(1)' },
    { imageUrl: 'ftp://images.example.com/producto.png' },
    { imageUrl: 'https://user:password@images.example.com/producto.jpg' },
    { imageUrl: 'https://images.example.com/producto.svg' },
    { imageUrl: 'https://images.example.com/producto.png/redirect' },
    { imageUrl: 'not-a-url' },
    { unexpected: true }
  ]) {
    assert.ok(productSchema.validate({ ...validProduct, ...changes }).error, JSON.stringify(changes));
  }
});
