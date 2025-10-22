const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/database');
const notificationService = require('./services/notificationService');
const cronJobService = require('./services/cronJobService');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware for logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🌐 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('📋 Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
  } else {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CORS_ORIGIN] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Middleware
app.use(cors(corsOptions));
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
app.use('/api', require('./routes/lessonRoutes'));
app.use('/api', require('./routes/assignmentRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

// New feature routes
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/discussions', require('./routes/discussionRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/study-groups', require('./routes/studyGroupRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('\n❌ ERROR OCCURRED:');
  console.error('📍 Route:', req.method, req.path);
  console.error('🔍 Error Name:', err.name);
  console.error('📝 Error Message:', err.message);
  console.error('📚 Error Stack:', err.stack);
  
  if (err.errors) {
    console.error('🔎 Validation Errors:', err.errors);
  }
  
  let error = { ...err };
  error.message = err.message;
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
    console.error('🎯 Cast Error - Invalid ObjectId');
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' đã tồn tại`;
    error = { message, statusCode: 400 };
    console.error('🔄 Duplicate Key Error:', field, '=', value);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = messages.join(', ');
    error = { message, statusCode: 400 };
    console.error('✅ Validation Errors:', messages);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Token không hợp lệ', statusCode: 401 };
    console.error('🔐 JWT Error - Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token đã hết hạn', statusCode: 401 };
    console.error('⏰ JWT Error - Token expired');
  }
  
  console.error('📤 Response Status:', error.statusCode || 500);
  console.error('📤 Response Message:', error.message || 'Server Error');
  console.error('─'.repeat(50));
  
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
  console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
  
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
