#!/usr/bin/env node

/**
 * Production Deployment Checker
 * Kiểm tra và chuẩn bị dự án cho production
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Production Deployment Checker');
console.log('================================');

// Kiểm tra environment variables
function checkEnvVariables() {
  const requiredEnvVars = [
    'NODE_ENV',
    'MONGODB_URI', 
    'JWT_SECRET',
    'CORS_ORIGIN',
    'EMAIL_USER',
    'EMAIL_PASS',
    'FRONTEND_URL'
  ];

  console.log('\n📋 Checking Environment Variables...');
  
  const missing = [];
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
      console.log(`❌ ${envVar}: Missing`);
    } else {
      console.log(`✅ ${envVar}: Set`);
    }
  });

  if (missing.length > 0) {
    console.log(`\n⚠️  Missing ${missing.length} environment variables`);
    console.log('Please set these variables before deployment');
    return false;
  }
  
  console.log('✅ All environment variables are set');
  return true;
}

// Kiểm tra JWT secret strength
function checkJWTSecurity() {
  console.log('\n🔐 Checking JWT Security...');
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    console.log('❌ JWT_SECRET is too short (minimum 32 characters)');
    return false;
  }
  
  if (jwtSecret.includes('change_this') || jwtSecret.includes('your_')) {
    console.log('❌ JWT_SECRET appears to be default value');
    return false;
  }
  
  console.log('✅ JWT Secret is secure');
  return true;
}

// Kiểm tra database connection
function checkDatabaseConfig() {
  console.log('\n🗄️  Checking Database Configuration...');
  
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.log('❌ Using localhost database in production');
    return false;
  }
  
  console.log('✅ Database configuration looks good');
  return true;
}

// Kiểm tra CORS configuration
function checkCORSConfig() {
  console.log('\n🌐 Checking CORS Configuration...');
  
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.log('❌ CORS_ORIGIN still pointing to localhost in production');
    return false;
  }
  
  console.log('✅ CORS configuration looks good');
  return true;
}

// Main checker
async function runProductionCheck() {
  let allPassed = true;
  
  allPassed &= checkEnvVariables();
  allPassed &= checkJWTSecurity();
  allPassed &= checkDatabaseConfig();
  allPassed &= checkCORSConfig();
  
  console.log('\n================================');
  if (allPassed) {
    console.log('🎉 Production deployment check PASSED!');
    console.log('Your application is ready for production deployment.');
  } else {
    console.log('❌ Production deployment check FAILED!');
    console.log('Please fix the issues above before deploying.');
    process.exit(1);
  }
}

// Chỉ chạy nếu được gọi trực tiếp
if (require.main === module) {
  require('dotenv').config();
  runProductionCheck();
}

module.exports = { runProductionCheck };