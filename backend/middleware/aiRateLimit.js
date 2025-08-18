const rateLimit = require('express-rate-limit');

//Simple per-IP limiter
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 12, // Slightly below 15/minute
  message: {
    error: 'Too many AI requests. Please wait a moment before trying again.',
    retryAfter: '60 seconds',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const dailyAILimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1400, // Slightly below 1500/day
  message: {
    error: 'Daily AI request limit reached. Please try again tomorrow.',
    retryAfter: '24 hours',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimit, dailyAILimit };
