require('dotenv').config();

// Monitoramento de erros — só ativa quando SENTRY_DSN está definido
let Sentry = null;
if (process.env.SENTRY_DSN) {
  Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Initialize database (creates tables if needed)
require('./database/db');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');
const budgetRoutes = require('./routes/budgets');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const savingsRoutes = require('./routes/savings');
const paymentRoutes = require('./routes/payments');
const { startRecurringJob } = require('./jobs/recurringTransactions');
const { startExpenseReminderJob } = require('./jobs/expenseReminders');
const { startMonthlyReportJob } = require('./jobs/monthlyReport');
const { startBackupJob } = require('./jobs/backup');
const { startSubscriptionExpiryJob } = require('./jobs/subscriptionExpiry');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:3000',
  'https://planejix.com.br',
  'https://www.planejix.com.br',
  'https://planejix.vercel.app',
];
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// URLs de deploy/preview do projeto na Vercel (ex: frontend-abc123-diephyz-s-projects.vercel.app)
const vercelPreviewPattern = /^https:\/\/frontend-[a-z0-9]+-diephyz-s-projects\.vercel\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl, apps nativos, webhook MP
  if (allowedOrigins.includes(origin)) return true;
  if (vercelPreviewPattern.test(origin)) return true;
  return false;
}

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) cb(null, true);
    else {
      console.warn(`[CORS] Origem rejeitada: ${origin}`);
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check para monitoramento de uptime — valida servidor + banco
app.get('/api/health', (req, res) => {
  try {
    const db = require('./database/db');
    db.prepare('SELECT 1').get();
    res.json({ ok: true, uptime: Math.round(process.uptime()) });
  } catch (err) {
    res.status(503).json({ ok: false, error: 'database' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/payments', paymentRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (Sentry) Sentry.captureException(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
  startRecurringJob();
  startExpenseReminderJob();
  startMonthlyReportJob();
  startBackupJob();
  startSubscriptionExpiryJob();
});
