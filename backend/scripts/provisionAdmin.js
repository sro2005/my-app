const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const CONFIRMATION_PHRASE = 'CREATE_ADMIN_ACCOUNT';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ProvisioningError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProvisioningError';
  }
}

const getProvisioningConfig = (env = process.env) => {
  if (env.ADMIN_BOOTSTRAP_CONFIRM !== CONFIRMATION_PHRASE) {
    throw new ProvisioningError(`Para autorizar la operación, configura ADMIN_BOOTSTRAP_CONFIRM=${CONFIRMATION_PHRASE} temporalmente.`);
  }
  if (env.NODE_ENV === 'production' && env.ALLOW_ADMIN_PROVISIONING !== 'true') {
    throw new ProvisioningError('En producción, habilita ALLOW_ADMIN_PROVISIONING=true solo durante el aprovisionamiento y retíralo después.');
  }

  const mongoUri = env.MONGO_URI || env.MONGODB_URI;
  if (typeof mongoUri !== 'string' || !mongoUri.trim()) {
    throw new ProvisioningError('Falta MONGO_URI o MONGODB_URI en el entorno del backend.');
  }

  const email = typeof env.ADMIN_BOOTSTRAP_EMAIL === 'string'
    ? env.ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase()
    : '';
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new ProvisioningError('ADMIN_BOOTSTRAP_EMAIL debe contener una dirección de correo válida.');
  }

  const password = typeof env.ADMIN_BOOTSTRAP_PASSWORD === 'string' ? env.ADMIN_BOOTSTRAP_PASSWORD : '';
  if (
    password.length < 16 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^a-zA-Z0-9]/.test(password)
  ) {
    throw new ProvisioningError('La contraseña temporal debe tener al menos 16 caracteres e incluir mayúsculas, minúsculas, números y símbolos.');
  }

  return { mongoUri: mongoUri.trim(), email, password };
};

const provisionAdmin = async ({ env = process.env, database = mongoose, CustomerModel = Customer, hashPassword = bcrypt.hash } = {}) => {
  const config = getProvisioningConfig(env);
  await database.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  try {
    const existing = await CustomerModel.findOne({ email: config.email }).select('_id role');
    if (existing) {
      throw new ProvisioningError('Ese correo ya existe. Por seguridad, este proceso no cambia roles ni restablece contraseñas.');
    }

    const passwordHash = await hashPassword(config.password, 12);
    const admin = new CustomerModel({
      email: config.email,
      password: passwordHash,
      role: 'admin',
      status: 'Active'
    });
    await admin.save();

    return { id: String(admin._id), email: config.email };
  } finally {
    await database.disconnect();
  }
};

if (require.main === module) {
  provisionAdmin()
    .then(({ email }) => {
      console.log(`Cuenta administradora creada para ${email}. La contraseña no se muestra; elimina las variables temporales de aprovisionamiento.`);
    })
    .catch(error => {
      if (error instanceof ProvisioningError) {
        console.error('No se pudo aprovisionar la cuenta: ' + error.message);
      } else {
        console.error('No se pudo completar el aprovisionamiento. Revisa la conexión y los permisos de MongoDB sin compartir credenciales ni registros que contengan secretos.');
      }
      process.exitCode = 1;
    });
}

module.exports = { getProvisioningConfig, provisionAdmin, ProvisioningError, CONFIRMATION_PHRASE };
