const WINDOW_MS = 15 * 60 * 1000;

const getClientAddress = (req) => {
  // Render/Cloudflare supplies this header at the edge; fall back to Express' IP locally.
  const edgeAddress = req.get?.('cf-connecting-ip');
  const address = typeof edgeAddress === 'string' ? edgeAddress.split(',')[0].trim() : '';
  return address || req.ip || req.socket?.remoteAddress || 'unknown';
};

const createRequestRateLimiter = ({
  windowMs = WINDOW_MS,
  maxRequests = 10,
  keyGenerator = getClientAddress,
  message = 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
  now = Date.now
} = {}) => {
  const requestsByKey = new Map();

  return (req, res, next) => {
    const currentTime = now();
    for (const [key, entry] of requestsByKey) {
      if (entry.resetAt <= currentTime) requestsByKey.delete(key);
    }

    const key = keyGenerator(req);
    if (typeof key !== 'string' || !key) return next();

    const entry = requestsByKey.get(key);
    if (entry && entry.count >= maxRequests) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000))));
      return res.status(429).json({ message });
    }

    if (entry) entry.count += 1;
    else requestsByKey.set(key, { count: 1, resetAt: currentTime + windowMs });

    return next();
  };
};

const limitLoginByIp = createRequestRateLimiter({
  maxRequests: 30,
  message: 'Demasiados intentos de inicio de sesión desde esta conexión. Intenta más tarde.'
});

const limitLoginByAccount = createRequestRateLimiter({
  maxRequests: 8,
  keyGenerator: req => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
    return email ? `login:${getClientAddress(req)}:${email}` : '';
  },
  message: 'Demasiados intentos para esta cuenta desde esta conexión. Intenta más tarde.'
});

const limitPasswordRecovery = createRequestRateLimiter({
  maxRequests: 5,
  message: 'Se alcanzó el límite de solicitudes de recuperación. Intenta más tarde.'
});

const limitPasswordReset = createRequestRateLimiter({
  maxRequests: 10,
  message: 'Demasiados intentos para restablecer la contraseña. Intenta más tarde.'
});

module.exports = {
  getClientAddress,
  createRequestRateLimiter,
  limitLoginByIp,
  limitLoginByAccount,
  limitPasswordRecovery,
  limitPasswordReset
};
