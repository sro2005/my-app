const createAssistantRateLimiter = ({ windowMs = 10 * 60 * 1000, maxRequests = 12, now = Date.now } = {}) => {
  const requestsByAddress = new Map();
  let requestsSinceCleanup = 0;
  const maxTrackedAddresses = 10000;

  return (req, res, next) => {
    const currentTime = now();
    requestsSinceCleanup += 1;

    // Amortize expiry cleanup and bound memory when requests use many unique addresses.
    if (requestsSinceCleanup % 100 === 0) {
      for (const [address, entry] of requestsByAddress) {
        if (entry.resetAt <= currentTime) requestsByAddress.delete(address);
      }
    }

    // server.js configures the trusted Render proxy chain, so req.ip is the resolved client IP.
    // Do not read raw client-supplied forwarding headers here.
    const address = req.ip || req.socket?.remoteAddress || 'unknown';
    let entry = requestsByAddress.get(address);

    if (entry && entry.resetAt <= currentTime) {
      requestsByAddress.delete(address);
      entry = undefined;
    }

    if (entry && entry.count >= maxRequests) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000))));
      return res.status(429).json({ message: 'Has alcanzado el límite temporal de consultas. Intenta más tarde.' });
    }

    if (entry) {
      entry.count += 1;
    } else {
      if (requestsByAddress.size >= maxTrackedAddresses) {
        const oldestAddress = requestsByAddress.keys().next().value;
        if (oldestAddress !== undefined) requestsByAddress.delete(oldestAddress);
      }
      requestsByAddress.set(address, { count: 1, resetAt: currentTime + windowMs });
    }

    return next();
  };
};

const limitAssistantRequests = createAssistantRateLimiter();

module.exports = { createAssistantRateLimiter, limitAssistantRequests };
