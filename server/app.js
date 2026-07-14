const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { env, getClientOrigins } = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiters');
const { sendSuccess } = require('./utils/apiResponse');

const volunteerRoutes = require('./routes/volunteerRoutes');
const donationRoutes = require('./routes/donationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const eventRoutes = require('./routes/eventRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const galleryRoutes = require('./routes/galleryRoutes');

const app = express();

// Render/Railway/Vercel-style platforms sit one reverse-proxy hop in front of
// this app, so the real client IP arrives via X-Forwarded-For. Without this,
// express-rate-limit either sees the proxy's IP for every request (limiting
// ALL users together) or throws a validation error. `1` trusts exactly one
// hop — safer than `true`, which would trust the header from anyone.
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Sets baseline security headers (CSP, X-Content-Type-Options, X-Frame-Options,
// etc). Placed first so every response — including errors — carries them.
app.use(helmet());

app.use(
  cors({
    origin: getClientOrigins(),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Defense-in-depth: a generous IP-based ceiling across the whole API.
// Tighter, endpoint-specific limiters (login, chat, forms) are applied
// inside their own route files.
app.use('/api', globalLimiter);

app.get('/api/health', (_req, res) => {
  sendSuccess(res, {
    message: 'Ek Nai Pehal API is running',
  });
});

app.use('/api/volunteers', volunteerRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gallery', galleryRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

module.exports = app;
 