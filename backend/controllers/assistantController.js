// ElectroVibeHome intentionally runs the shopping guide locally to avoid API charges.
const getStatus = (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.status(200).json({ enabled: false, mode: 'local' });
};

const chat = (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.status(503).json({
    message: 'La Guía ElectroVibe está configurada en modo local y no utiliza una API de IA de pago.'
  });
};

module.exports = { getStatus, chat };
