#!/usr/bin/env node

/**
 * Test script to verify email URL generation in production
 */

require('dotenv').config();

// Set production environment
process.env.NODE_ENV = 'production';

// Import email config
const { getFrontendUrl } = require('./src/config/email-new');

console.log('🔍 Testing Email URL Generation');
console.log('================================');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log(`Generated Frontend URL: ${getFrontendUrl()}`);
console.log('================================');

// Test various email links
console.log('\n📧 Sample Email Links:');
console.log('Verification:', `${getFrontendUrl()}/verify-email?token=ABC123`);
console.log('Password Reset:', `${getFrontendUrl()}/reset-password?token=XYZ789`);
console.log('Course View:', `${getFrontendUrl()}/courses/course-id-123`);
console.log('Dashboard:', `${getFrontendUrl()}/dashboard`);
console.log('Admin:', `${getFrontendUrl()}/admin`);

// Verify no localhost in production
const frontendUrl = getFrontendUrl();
if (process.env.NODE_ENV === 'production' && frontendUrl.includes('localhost')) {
  console.error('❌ ERROR: Production environment is using localhost URL!');
  process.exit(1);
} else {
  console.log('✅ SUCCESS: Production URL is correctly configured');
}