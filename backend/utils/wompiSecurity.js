const crypto = require('crypto');

const getPath = (object, path) =>
  path.split('.').reduce((value, key) => value == null ? undefined : value[key], object);

const secureEquals = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

const calculateIntegritySignature = (reference, amountInCents, currency, secret) =>
  crypto.createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${secret}`)
    .digest('hex');

const calculateEventChecksum = (event, secret) => {
  if (!event || !Array.isArray(event.signature?.properties) || event.timestamp == null || !secret) {
    throw new Error('Evento o configuración de firma incompletos');
  }
  const values = event.signature.properties.map(path => {
    const value = getPath(event.data, path);
    if (value === undefined || value === null) throw new Error('Propiedad de firma faltante');
    return String(value);
  });
  return crypto.createHash('sha256')
    .update(values.join('') + String(event.timestamp) + secret)
    .digest('hex');
};

module.exports = { getPath, secureEquals, calculateIntegritySignature, calculateEventChecksum };
