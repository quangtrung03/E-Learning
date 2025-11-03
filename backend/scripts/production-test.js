#!/usr/bin/env node

/**
 * Production Deployment Test Script
 * Tests API endpoints and basic functionality after deployment
 */

const axios = require('axios');

// Use same logic as frontend: base URL + /api suffix
const API_BASE_URL = process.env.API_URL || 'https://e-learning-zmif.onrender.com';
const API_BASE = `${API_BASE_URL}/api`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://e-learning-five-puce.vercel.app';

console.log('🚀 Starting Production Deployment Test...\n');
console.log(`📍 API Base: ${API_BASE}`);
console.log(`🌐 Frontend: ${FRONTEND_URL}\n`);

async function testHealthCheck() {
  try {
    console.log('🏥 Testing Health Check...');
    const response = await axios.get(`${API_BASE}/health`, {
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ Health Check: PASSED');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Service: ${response.data.service}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Health Check: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testCORS() {
  try {
    console.log('\n🌐 Testing CORS Configuration...');
    const response = await axios.get(`${API_BASE}/health`, {
      headers: {
        'Origin': FRONTEND_URL
      },
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ CORS: PASSED');
      console.log(`   Origin allowed: ${FRONTEND_URL}`);
      return true;
    }
  } catch (error) {
    console.log('❌ CORS: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testRegistration() {
  try {
    console.log('\n👤 Testing User Registration...');
    
    const testUser = {
      name: 'Test User Production',
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!'
    };
    
    const response = await axios.post(`${API_BASE}/auth/register`, testUser, {
      headers: {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    if (response.status === 201) {
      console.log('✅ Registration: PASSED');
      console.log(`   User created: ${testUser.email}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Registration: FAILED');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function testLogin() {
  try {
    console.log('\n🔐 Testing Admin Login...');
    
    const loginData = {
      email: 'admin@elearning.com',
      password: 'admin123'
    };
    
    const response = await axios.post(`${API_BASE}/auth/login`, loginData, {
      headers: {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    if (response.status === 200 && response.data.token) {
      console.log('✅ Admin Login: PASSED');
      console.log(`   Token received: ${response.data.token.substring(0, 20)}...`);
      return response.data.token;
    }
  } catch (error) {
    console.log('❌ Admin Login: FAILED');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return null;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 PRODUCTION DEPLOYMENT TEST SUITE');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // Test 1: Health Check
  results.push(await testHealthCheck());
  
  // Test 2: CORS
  results.push(await testCORS());
  
  // Test 3: Registration
  results.push(await testRegistration());
  
  // Test 4: Admin Login
  const token = await testLogin();
  results.push(!!token);
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`❌ Failed: ${total - passed}/${total} tests`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Production deployment is ready.');
    console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
    console.log(`🔗 API Health: ${API_BASE}/health`);
    console.log(`📚 Test login: admin@elearning.com / admin123`);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite crashed:', error.message);
  process.exit(1);
});