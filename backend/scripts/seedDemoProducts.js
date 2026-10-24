const mongoose = require('mongoose');
const Product = require('../models/Product');
const demoProducts = require('../../data/demo-products.json');

const getTargetDatabaseName = (uri) => {
  try {
    const url = new URL(uri);
    return decodeURIComponent(url.pathname.replace(/^\//, '').split('/')[0] || '');
  } catch {
    return '';
  }
};

const seedDemoProducts = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seeding de demostración está bloqueado cuando NODE_ENV=production.');
  }
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Para confirmar la intención, establece ALLOW_DEMO_SEED=true.');
  }

  const uri = process.env.DEMO_MONGODB_URI;
  if (!uri) {
    throw new Error('Falta DEMO_MONGODB_URI. No se usa MONGODB_URI para evitar tocar la base de datos original.');
  }
  if (process.env.MONGODB_URI && uri === process.env.MONGODB_URI) {
    throw new Error('DEMO_MONGODB_URI no puede ser igual a MONGODB_URI.');
  }

  const databaseName = getTargetDatabaseName(uri);
  if (!databaseName || !/(demo|test|sandbox)/i.test(databaseName)) {
    throw new Error('La base de datos de destino debe tener un nombre que incluya demo, test o sandbox.');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    let inserted = 0;
    let existing = 0;

    for (const product of demoProducts) {
      const document = {
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
        imageUrl: product.imageUrl || '',
        demo: product.demo === true,
        demoIcon: product.demoIcon || '',
        catalogVersion: product.catalogVersion || 'electrovibehome-v2-demo'
      };
      const result = await Product.updateOne(
        { name: product.name, category: product.category },
        { $setOnInsert: document },
        { upsert: true }
      );
      inserted += result.upsertedCount || 0;
      existing += result.matchedCount || 0;
    }

    console.log('Catálogo de demostración procesado.');
    console.log('Productos nuevos insertados: ' + inserted);
    console.log('Productos existentes conservados: ' + existing);
    console.log('Total de fichas de ejemplo incluidas en el catálogo: ' + demoProducts.length);
  } finally {
    await mongoose.disconnect();
  }
};

seedDemoProducts().catch(async (error) => {
  console.error('No se pudo cargar el catálogo de demostración: ' + error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // No había una conexión abierta que cerrar.
  }
  process.exitCode = 1;
});
