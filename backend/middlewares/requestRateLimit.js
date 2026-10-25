const WINDOW_MS = 15 * 60 * 1000;

const getClientAddress = (req) => {
  // In production, Express derives req.ip from the X-Forwarded-For chain after
  // server.js configures the trusted Render proxy hops. Do not trust raw client headers here.
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const createRequestRateLimiter = ({
  windowMs = WINDOW_MS,
  maxRequests = 10,
  keyGenerator = getClientAddress,
  message = 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
  now = Date.now
} = {}) => {
  const requestsByKey = new Map();
  let requestsSinceCleanup = 0;
  const maxTrackedKeys = 10000;

  return (req, res, next) => {
    const currentTime = now();
    requestsSinceCleanup += 1;
    // Evita escanear el mapa completo en cada solicitud; las claves usadas se
    // comprueban individualmente y la limpieza global se amortiza cada 100 peticiones.
    if (requestsSinceCleanup % 100 === 0) {
      for (const [trackedKey, trackedEntry] of requestsByKey) {
        if (trackedEntry.resetAt <= currentTime) requestsByKey.delete(trackedKey);
      }
    }

    const key = keyGenerator(req);
    if (typeof key !== 'string' || !key) return next();

    let entry = requestsByKey.get(key);
    if (entry && entry.resetAt <= currentTime) {
      requestsByKey.delete(key);
      entry = undefined;
    }
    if (entry && entry.count >= maxRequests) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000))));
      return res.status(429).json({ message });
    }

    if (entry) entry.count += 1;
    else {
      if (requestsByKey.size >= maxTrackedKeys) {
        const oldestKey = requestsByKey.keys().next().value;
        if (oldestKey !== undefined) requestsByKey.delete(oldestKey);
      }
      requestsByKey.set(key, { count: 1, resetAt: currentTime + windowMs });
    }

    return next();
  };
};

const limitRegistrationByIp = createRequestRateLimiter({
  maxRequests: 10,
  message: 'Demasiados intentos de registro desde esta conexión. Intenta más tarde.'
});

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

const limitPasswordChange = createRequestRateLimiter({
  maxRequests: 10,
  message: 'Demasiados intentos para cambiar la contraseña. Intenta más tarde.'
});

module.exports = {
  getClientAddress,
  createRequestRateLimiter,
  limitRegistrationByIp,
  limitLoginByIp,
  limitLoginByAccount,
  limitPasswordRecovery,
  limitPasswordReset,
  limitPasswordChange
};
