/**
 * Script kiểm tra Environment Variables
 * Chạy để verify tất cả env vars cần thiết trước khi deploy
 */

require('dotenv').config();

const chalk = require('chalk') || { 
  green: (s) => s, 
  red: (s) => s, 
  yellow: (s) => s, 
  blue: (s) => s 
};

console.log('\n🔍 KIỂM TRA ENVIRONMENT VARIABLES\n');
console.log('='.repeat(70));

const requiredVars = {
  'MONGODB_URI': {
    required: true,
    sensitive: true,
    validate: (val) => {
      if (!val) return 'Missing';
      if (!val.startsWith('mongodb://') && !val.startsWith('mongodb+srv://')) {
        return 'Invalid format - must start with mongodb:// or mongodb+srv://';
      }
      if (val.includes('hoctructuyen')) {
        return '⚠️  WARNING: Using old hostname "hoctructuyen" - should be "elearning"';
      }
      if (!val.includes('elearning.kyyqvl7.mongodb.net')) {
        return '⚠️  WARNING: Hostname might be incorrect';
      }
      return 'OK';
    }
  },
  'NODE_ENV': {
    required: true,
    validate: (val) => val === 'production' || val === 'development' ? 'OK' : 'Should be production or development'
  },
  'JWT_SECRET': {
    required: true,
    sensitive: true,
    validate: (val) => val && val.length >= 20 ? 'OK' : 'Should be at least 20 characters'
  },
  'JWT_REFRESH_SECRET': {
    required: true,
    sensitive: true,
    validate: (val) => val && val.length >= 20 ? 'OK' : 'Should be at least 20 characters'
  },
  'CORS_ORIGIN': {
    required: true,
    validate: (val) => val && val.startsWith('http') ? 'OK' : 'Should be a valid URL'
  },
  'FRONTEND_URL': {
    required: true,
    validate: (val) => val && val.startsWith('http') ? 'OK' : 'Should be a valid URL'
  },
  'SENDGRID_API_KEY': {
    required: false,
    sensitive: true,
    validate: (val) => val && val.startsWith('SG.') ? 'OK' : 'Should start with SG.'
  },
  'SENDGRID_FROM_EMAIL': {
    required: false,
    validate: (val) => val && val.includes('@') ? 'OK' : 'Should be valid email'
  }
};

let hasErrors = false;
let hasWarnings = false;

Object.entries(requiredVars).forEach(([key, config]) => {
  const value = process.env[key];
  const status = config.validate ? config.validate(value) : (value ? 'OK' : 'Missing');
  
  let displayValue = value;
  if (config.sensitive && value) {
    if (value.length > 20) {
      displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 5);
    } else {
      displayValue = '***';
    }
  }
  
  let statusIcon = '✅';
  let statusColor = 'green';
  
  if (status === 'Missing' && config.required) {
    statusIcon = '❌';
    statusColor = 'red';
    hasErrors = true;
  } else if (status !== 'OK' && status !== 'Missing') {
    if (status.includes('WARNING')) {
      statusIcon = '⚠️ ';
      statusColor = 'yellow';
      hasWarnings = true;
    } else {
      statusIcon = '❌';
      statusColor = 'red';
      hasErrors = true;
    }
  } else if (status === 'Missing') {
    statusIcon = '⚠️ ';
    statusColor = 'yellow';
  }
  
  console.log(`${statusIcon} ${key.padEnd(25)} | ${displayValue ? displayValue.substring(0, 40) : 'NOT SET'.padEnd(40)} | ${status}`);
});

console.log('='.repeat(70));

// Check MongoDB connection
if (process.env.MONGODB_URI) {
  console.log('\n📊 MONGODB URI DETAILS:');
  console.log('-'.repeat(70));
  
  const uri = process.env.MONGODB_URI;
  
  // Parse hostname
  const hostnameMatch = uri.match(/@([^/]+)/);
  if (hostnameMatch) {
    console.log(`🌐 Hostname: ${hostnameMatch[1]}`);
    
    if (hostnameMatch[1].includes('hoctructuyen')) {
      console.log(`❌ ERROR: Wrong hostname! Should be: elearning.kyyqvl7.mongodb.net`);
      hasErrors = true;
    } else if (hostnameMatch[1].includes('elearning.kyyqvl7.mongodb.net')) {
      console.log(`✅ Hostname is correct!`);
    }
  }
  
  // Parse database name
  const dbMatch = uri.match(/\/([^?]+)/);
  if (dbMatch) {
    console.log(`🗄️  Database: ${dbMatch[1]}`);
  }
  
  // Check protocol
  if (uri.startsWith('mongodb+srv://')) {
    console.log(`✅ Protocol: mongodb+srv:// (DNS Seedlist)`);
  } else if (uri.startsWith('mongodb://')) {
    console.log(`✅ Protocol: mongodb:// (Standard)`);
  } else {
    console.log(`❌ Invalid protocol!`);
    hasErrors = true;
  }
}

console.log('\n');

if (hasErrors) {
  console.log('❌ CÓ LỖI CẦN FIX TRƯỚC KHI DEPLOY!');
  console.log('\n📋 HƯỚNG DẪN FIX:');
  console.log('1. Truy cập Render Dashboard: https://dashboard.render.com');
  console.log('2. Chọn service E-Learning (backend)');
  console.log('3. Vào tab Environment');
  console.log('4. Thêm/sửa các environment variables bị lỗi');
  console.log('5. Click "Save Changes" và đợi auto-deploy\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  CÓ CẢNH BÁO - NÊN KIỂM TRA LẠI');
  process.exit(0);
} else {
  console.log('✅ TẤT CẢ ENVIRONMENT VARIABLES ĐỀU OK!');
  process.exit(0);
}
