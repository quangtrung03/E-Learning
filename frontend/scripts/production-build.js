#!/usr/bin/env node

/**
 * Frontend Production Build Script
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Frontend Production Build');
console.log('============================');

// Kiểm tra environment variables
function checkEnvVars() {
  console.log('\n📋 Checking Environment Variables...');
  
  const requiredVars = ['VITE_API_URL'];
  const missing = [];
  
  requiredVars.forEach(envVar => {
    const value = process.env[envVar];
    if (!value) {
      missing.push(envVar);
      console.log(`❌ ${envVar}: Missing`);
    } else if (value.includes('localhost') && process.env.NODE_ENV === 'production') {
      console.log(`⚠️  ${envVar}: Points to localhost (${value})`);
    } else {
      console.log(`✅ ${envVar}: ${value}`);
    }
  });
  
  return missing.length === 0;
}

// Build production
function buildProduction() {
  console.log('\n🔨 Building for production...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully!');
    
    // Kiểm tra build size
    const distPath = path.join(__dirname, '..', 'dist');
    if (fs.existsSync(distPath)) {
      const stats = fs.statSync(distPath);
      console.log(`📦 Build output created at: ${distPath}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Build failed:', error.message);
    return false;
  }
}

// Run production build
function runProductionBuild() {
  const envOk = checkEnvVars();
  
  if (!envOk) {
    console.log('\n❌ Please fix environment variables first');
    process.exit(1);
  }
  
  const buildOk = buildProduction();
  
  if (buildOk) {
    console.log('\n🎉 Production build completed!');
    console.log('Ready for deployment to Vercel');
  } else {
    console.log('\n❌ Production build failed!');
    process.exit(1);
  }
}

// Chỉ chạy nếu được gọi trực tiếp
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  runProductionBuild();
}