const pino = require('pino');
const { env } = require('./env');

/**
 * Application logger.
 * JSON output in production; pretty-print in development for readability.
 */
const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino/file',
      options: { destination: 1 },
    },
  }),
});

module.exports = logger;
