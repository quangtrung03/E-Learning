const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/database');
const { initGridFS } = require('./config/gridfs');
const notificationService = require('./services/notificationService');
const cronJobService = require('./services/cronJobService');

// Load environment variables
dotenv.config();

// Note: Punycode deprecation warning is from dependencies, not our code
// This will be resolved when dependencies update to newer Node.js APIs

// Connect to database
connectDB();

// Initialize GridFS after database connection
const mongoose = require('mongoose');
mongoose.connection.once('open', () => {
  initGridFS();
});

const app = express();

// Trust proxy for Render deployment (IMPORTANT for rate limiting)
app.set('trust proxy', 1);

// Middleware for logging - Production optimized
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🌐 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('📋 Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
  } else if (process.env.LOG_LEVEL === 'info') {
    // Only log important requests in production
    if (req.method !== 'GET' || req.path.includes('/api/')) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
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
    console.log(`⚠️ Rate limit reached for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
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

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Swagger UI - chỉ trong development
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "E-Learning API Documentation"
  }));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'E-Learning Backend API',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

// New feature routes
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/discussions', require('./routes/discussionRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/study-groups', require('./routes/studyGroupRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// File serving routes (GridFS)
app.use('/api/files', require('./routes/fileRoutes'));

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Detailed logging only in development
  if (process.env.NODE_ENV === 'development') {
    console.error('\n❌ ERROR OCCURRED:');
    console.error('📍 Route:', req.method, req.path);
    console.error('🔍 Error Name:', err.name);
    console.error('📝 Error Message:', err.message);
    console.error('📚 Error Stack:', err.stack);
    if (err.errors) {
      console.error('🔎 Validation Errors:', err.errors);
    }
  } else {
    // Production logging - concise but informative
    console.error(`${new Date().toISOString()} - ERROR: ${req.method} ${req.path} - ${err.message}`);
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
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

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
    // Initialize Socket.IO for real-time notifications
    notificationService.initSocketIO(server);
    console.log('📡 Socket.IO initialized for real-time notifications');
    
    // Initialize cron jobs
    cronJobService.init();
    console.log('⏰ Cron job service initialized');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
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

// Export app for testing
module.exports = app;
