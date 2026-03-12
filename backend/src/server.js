const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/database');
const notificationService = require('./services/notificationService');
const cronJobService = require('./services/cronJobService');

// Load environment variables
dotenv.config();

// Optional error tracking (Sentry)
let Sentry = null;
if (process.env.SENTRY_DSN) {
  try {
    // eslint-disable-next-line global-require
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development'
    });
    console.log('✅ Sentry initialized');
  } catch (e) {
    console.warn('⚠️ Failed to initialize Sentry:', e.message);
    Sentry = null;
  }
}

// Note: Punycode deprecation warning is from dependencies, not our code
// This will be resolved when dependencies update to newer Node.js APIs

// Connect to database (skip in test to allow smoke tests without Mongo)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// Trust proxy for Render deployment (IMPORTANT for rate limiting)
app.set('trust proxy', 1);

// Request ID middleware (Observability)
app.use((req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim().length > 0)
    ? incomingId.trim()
    : (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Logging middleware (structured access logs)
app.use((req, res, next) => {
  const startNs = process.hrtime.bigint();

  res.on('finish', () => {
    if (process.env.LOG_LEVEL !== 'info') return;

    const durationMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    const logLine = {
      timestamp: new Date().toISOString(),
      level: 'info',
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      ip: req.ip,
      userId: req.user?._id
    };

    console.log(JSON.stringify(logLine));
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🌐 ${new Date().toISOString()} [${req.requestId}] - ${req.method} ${req.path}`);
    console.log('📋 Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
  }

  next();
});

// CORS configuration - Production ready
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Log origin only in non-production for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 CORS Check - Origin:', origin);
    }
    
    // Define allowed origins based on environment
    const allowedOrigins = [
      // Production domains
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      // Development domains (only in dev mode)
      ...(process.env.NODE_ENV !== 'production' ? [
        'http://localhost:5173',
        'http://localhost:3000'
      ] : [])
    ].filter(Boolean);
    
    // Also allow any Vercel deployment
    const isVercelDomain = /^https:\/\/.*\.vercel\.app$/.test(origin);
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    if (isAllowedOrigin || isVercelDomain) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🚫 CORS: Origin blocked -', origin);
        console.log('📋 Allowed origins:', allowedOrigins);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  preflightContinue: false
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
}));

// CORS - MUST be before rate limiting
app.use(cors(corsOptions));

// Rate limiting (Fixed deprecated onLimitReached)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ [${req.requestId}] Rate limit reached for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau',
      requestId: req.requestId
    });
  }
  // Removed deprecated onLimitReached
});

// Middleware để thêm rate limit headers cho tất cả responses
app.use((req, res, next) => {
  res.set('X-RateLimit-Limit', process.env.NODE_ENV === 'production' ? '100' : '1000');
  res.set('X-RateLimit-Window', '900'); // 15 minutes in seconds
  next();
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads) - use absolute path to avoid cwd issues
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Swagger UI - chỉ trong development
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "E-Learning API Documentation"
  }));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log(`🏥 [${req.requestId}] Health check requested`);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'E-Learning Backend API',
    version: '1.0.0',
    requestId: req.requestId
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
// NOTE: /api/admin/media MUST be registered before /api/admin to avoid double-auth middleware
app.use('/api/admin/media', require('./routes/mediaRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// New feature routes
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/discussions', require('./routes/discussionRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/study-groups', require('./routes/studyGroupRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));

// Social & Search
app.use('/api/social', require('./routes/socialRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));

// Content routes
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/instructors', require('./routes/instructorRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    requestId: req.requestId
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (Sentry) {
    Sentry.withScope((scope) => {
      scope.setTag('requestId', req.requestId);
      scope.setTag('method', req.method);
      scope.setTag('path', req.originalUrl || req.path);
      if (req.user?._id) {
        scope.setUser({ id: String(req.user._id) });
      }
      Sentry.captureException(err);
    });
  }

  // Detailed logging only in development
  if (process.env.NODE_ENV === 'development') {
    console.error('\n❌ ERROR OCCURRED:');
    console.error('🆔 Request ID:', req.requestId);
    console.error('📍 Route:', req.method, req.path);
    console.error('🔍 Error Name:', err.name);
    console.error('📝 Error Message:', err.message);
    console.error('📚 Error Stack:', err.stack);
    if (err.errors) {
      console.error('🔎 Validation Errors:', err.errors);
    }
  } else {
    // Production logging - concise but informative
    console.error(`${new Date().toISOString()} [${req.requestId}] - ERROR: ${req.method} ${req.path} - ${err.message}`);
  }
  
  let error = { ...err };
  error.message = err.message;
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
    if (process.env.NODE_ENV === 'development') {
      console.error('🎯 Cast Error - Invalid ObjectId');
    }
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' đã tồn tại`;
    error = { message, statusCode: 400 };
    if (process.env.NODE_ENV === 'development') {
      console.error('🔄 Duplicate Key Error:', field, '=', value);
    }
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = messages.join(', ');
    error = { message, statusCode: 400 };
    if (process.env.NODE_ENV === 'development') {
      console.error('✅ Validation Errors:', messages);
    }
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Token không hợp lệ', statusCode: 401 };
    if (process.env.NODE_ENV === 'development') {
      console.error('🔐 JWT Error - Invalid token');
    }
  }
  
  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token đã hết hạn', statusCode: 401 };
    if (process.env.NODE_ENV === 'development') {
      console.error('⏰ JWT Error - Token expired');
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.error('📤 Response Status:', error.statusCode || 500);
    console.error('📤 Response Message:', error.message || 'Server Error');
    console.error('─'.repeat(50));
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const startServer = () => {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    if (process.env.NODE_ENV === 'production') {
      const productionUrl = process.env.API_URL || process.env.RENDER_EXTERNAL_URL || 'https://e-learning-zmif.onrender.com';
      console.log(`🌐 API Health Check: ${productionUrl}/api/health`);
    } else {
      console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
    }

    // Initialize services
    if (process.env.NODE_ENV !== 'test') {
      // Initialize Socket.IO for real-time features (SINGLE INSTANCE)
      const { initializeSocket, getIO } = require('./services/socketService');
      initializeSocket(server);
      console.log('📡 Socket.IO initialized for real-time messaging');

      // Share Socket.IO instance with notification service
      const io = getIO();
      notificationService.setSocketIO(io);
      console.log('📡 Notification service connected to Socket.IO');

      // Initialize cron jobs
      cronJobService.init();
      console.log('⏰ Cron job service initialized');
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    if (Sentry) {
      Sentry.captureException(err);
    }
    console.log('Unhandled Rejection:', err.message);
    // Stop cron jobs before shutting down
    cronJobService.stopAllJobs();
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    cronJobService.stopAllJobs();
    server.close(() => {
      console.log('💤 Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('👋 SIGINT received. Shutting down gracefully...');
    cronJobService.stopAllJobs();
    server.close(() => {
      console.log('💤 Process terminated');
      process.exit(0);
    });
  });

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
