const createAssistantRateLimiter = ({ windowMs = 10 * 60 * 1000, maxRequests = 12, now = Date.now } = {}) => {
  const requestsByAddress = new Map();

  return (req, res, next) => {
    const currentTime = now();
    for (const [address, entry] of requestsByAddress) {
      if (entry.resetAt <= currentTime) requestsByAddress.delete(address);
    }

    // Render routes traffic through Cloudflare; its edge provides this client IP header.
    // Local development falls back to Express' socket-derived address.
    const address = req.get?.('cf-connecting-ip') || req.ip || req.socket?.remoteAddress || 'unknown';
    const entry = requestsByAddress.get(address);
    if (entry && entry.count >= maxRequests) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - currentTime) / 1000)));
      return res.status(429).json({ message: 'Has alcanzado el límite temporal de consultas. Intenta más tarde.' });
    }

    if (entry) entry.count += 1;
    else requestsByAddress.set(address, { count: 1, resetAt: currentTime + windowMs });

    return next();
  };
};

const limitAssistantRequests = createAssistantRateLimiter();

module.exports = { createAssistantRateLimiter, limitAssistantRequests };
