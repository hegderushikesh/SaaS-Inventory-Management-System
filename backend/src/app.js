const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { successResponse } = require('./utils/apiResponse');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Request body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  return successResponse(res, {
    message: 'StockFlow Backend API is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'StockFlow API'
    }
  });
});

// Root route
app.get('/', (req, res) => {
  return successResponse(res, {
    message: 'Welcome to StockFlow SaaS API',
    data: {
      documentation: '/api/health'
    }
  });
});

// Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Product & Inventory routes
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

// Dashboard routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

// Organization Settings routes
const settingsRoutes = require('./routes/settingsRoutes');
app.use('/api/settings', settingsRoutes);

// Stock Movement routes
const stockMovementRoutes = require('./routes/stockMovementRoutes');
app.use('/api/stock-movements', stockMovementRoutes);

// App-level 404 & error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
