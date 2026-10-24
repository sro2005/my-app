const test = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../models/Product');
const { validateProducts, reduceInventory, restoreInventory } = require('./productUtils');

const restoreMethod = (name, original) => { Product[name] = original; };

test('validateProducts aggregates repeated product ids and uses the transaction session', async t => {
  const originalFindById = Product.findById;
  t.after(() => restoreMethod('findById', originalFindById));
  const session = { id: 'test-session' };
  const calls = [];
  Product.findById = id => ({
    session(value) {
      calls.push({ id: String(id), session: value });
      return Promise.resolve({ name: 'Demo', quantity: 4 });
    }
  });

  await validateProducts([
    { productId: 'product-a', quantity: 1 },
    { productId: 'product-a', quantity: 2 }
  ], { session });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, 'product-a');
  assert.equal(calls[0].session, session);
});

test('validateProducts rejects insufficient aggregated stock', async t => {
  const originalFindById = Product.findById;
  t.after(() => restoreMethod('findById', originalFindById));
  Product.findById = async () => ({ name: 'Demo', quantity: 2 });

  await assert.rejects(
    validateProducts([
      { productId: 'product-a', quantity: 2 },
      { productId: 'product-a', quantity: 1 }
    ]),
    /Stock insuficiente/
  );
});

test('reduceInventory aggregates repeated ids and performs the decrement in-session', async t => {
  const originalFindOneAndUpdate = Product.findOneAndUpdate;
  t.after(() => restoreMethod('findOneAndUpdate', originalFindOneAndUpdate));
  const session = { id: 'transaction-session' };
  let received;
  Product.findOneAndUpdate = async (filter, update, options) => {
    received = { filter, update, options };
    return { _id: filter._id };
  };

  await reduceInventory([
    { productId: 'product-a', quantity: 1 },
    { productId: 'product-a', quantity: 2 }
  ], { session });

  assert.equal(received.filter._id, 'product-a');
  assert.equal(received.filter.quantity.$gte, 3);
  assert.equal(received.update.$inc.quantity, -3);
  assert.equal(received.options.session, session);
});

test('reduceInventory compensates earlier changes if a later product cannot be reserved', async t => {
  const originalFindOneAndUpdate = Product.findOneAndUpdate;
  const originalUpdateOne = Product.updateOne;
  t.after(() => {
    restoreMethod('findOneAndUpdate', originalFindOneAndUpdate);
    restoreMethod('updateOne', originalUpdateOne);
  });
  const applied = [];
  Product.findOneAndUpdate = async filter => {
    if (filter._id === 'product-b') return null;
    return { _id: filter._id };
  };
  Product.updateOne = async (...args) => { applied.push(args); };

  await assert.rejects(
    reduceInventory([
      { productId: 'product-a', quantity: 2 },
      { productId: 'product-b', quantity: 1 }
    ]),
    /Stock insuficiente/
  );

  assert.equal(applied.length, 1);
  assert.equal(applied[0][0]._id, 'product-a');
  assert.equal(applied[0][1].$inc.quantity, 2);
});


test('restoreInventory uses the provided session and fails if a referenced product is missing', async t => {
  const originalUpdateOne = Product.updateOne;
  t.after(() => restoreMethod('updateOne', originalUpdateOne));
  const session = { id: 'restore-session' };
  let received;
  Product.updateOne = async (...args) => {
    received = args;
    return { matchedCount: 0 };
  };

  await assert.rejects(
    restoreInventory([{ productId: 'product-missing', quantity: 2 }], { session }),
    /No se pudo restaurar el inventario/
  );
  assert.equal(received[0]._id, 'product-missing');
  assert.equal(received[1].$inc.quantity, 2);
  assert.equal(received[2].session, session);
});
