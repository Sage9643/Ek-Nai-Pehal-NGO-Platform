require('dotenv').config();

const { cleanEnv, str, port, num } = require('envalid');

/**
 * Validated environment variables.
 * Server exits on startup if required values are missing or invalid.
 */
const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),
  PORT: port({ default: 5000 }),
  MONGODB_URI: str({ desc: 'MongoDB connection string' }),
  GEMINI_API_KEY: str({ default: '', desc: 'Google Gemini API key for chatbot' }),
  LOG_LEVEL: str({
    choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
    default: 'info',
  }),
  CLIENT_ORIGIN: str({
    default: 'http://localhost:5174,https://ek-nai-pehal-ngo-platform.vercel.app',
    desc: 'Comma-separated allowed CORS origins',
  }),
  // Admin auth (optional until configured — checked at login time)
  ADMIN_EMAIL: str({ default: '' }),
  ADMIN_PASSWORD_HASH: str({ default: '' }),
  ADMIN_JWT_SECRET: str({ default: '' }),
  ADMIN_JWT_EXPIRES_IN: str({ default: '24h' }),
});

/** Parse comma-separated CORS origins into an array. */
const getClientOrigins = () =>
  env.CLIENT_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

module.exports = { env, getClientOrigins };
