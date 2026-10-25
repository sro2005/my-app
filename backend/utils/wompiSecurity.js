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

const isConfiguredSandboxValue = (value, prefix) =>
  typeof value === 'string' &&
  value.startsWith(prefix) &&
  !/(?:REEMPLAZAR|REPLACE[_ -]?ME|CHANGE[_ -]?ME|PLACEHOLDER|YOUR[_ -]?(?:KEY|SECRET))/i.test(value);

const hasSandboxWompiCredentials = ({ publicKey, integritySecret, eventsSecret } = {}) =>
  isConfiguredSandboxValue(publicKey, 'pub_test_') &&
  isConfiguredSandboxValue(integritySecret, 'test_integrity_') &&
  isConfiguredSandboxValue(eventsSecret, 'test_events_');

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

module.exports = { getPath, secureEquals, calculateIntegritySignature, calculateEventChecksum, hasSandboxWompiCredentials };
