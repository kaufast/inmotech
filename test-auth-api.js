#!/usr/bin/env node

/**
 * Test script for InmoTech Authentication API
 * Usage: node test-auth-api.js [baseUrl]
 */

const baseUrl = process.argv[2] || 'http://localhost:3000';

// Test user credentials
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

let accessToken = null;
let refreshToken = null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, path, body = null, headers = {}) {
  log(`\nTesting ${name}...`, 'blue');
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${path}`, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`✓ ${name} - Status: ${response.status}`, 'green');
      return data;
    } else {
      log(`✗ ${name} - Status: ${response.status}`, 'red');
      log(`  Error: ${data.error || 'Unknown error'}`, 'red');
      return null;
    }
  } catch (error) {
    log(`✗ ${name} - Network Error: ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('Starting InmoTech Authentication API Tests', 'yellow');
  log(`Base URL: ${baseUrl}`, 'yellow');
  log('='.repeat(50), 'yellow');

  // 1. Test Health Endpoint
  const health = await testEndpoint('Health Check', 'GET', '/api/health');
  if (health) {
    log(`  Version: ${health.version}`, 'green');
    log(`  Database: ${health.checks.database}`, 'green');
    log(`  Auth Config: ${health.checks.auth}`, 'green');
  }

  // 2. Test Registration
  const registration = await testEndpoint('User Registration', 'POST', '/api/auth/register', testUser);
  if (registration && registration.token) {
    accessToken = registration.token;
    log(`  User ID: ${registration.user.id}`, 'green');
    log(`  Email: ${registration.user.email}`, 'green');
  }

  // 3. Test Login
  const login = await testEndpoint('User Login', 'POST', '/api/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  if (login && login.tokens) {
    accessToken = login.tokens.accessToken;
    refreshToken = login.tokens.refreshToken;
    log(`  Access Token: ${accessToken.substring(0, 20)}...`, 'green');
    log(`  Refresh Token: ${refreshToken ? refreshToken.substring(0, 20) + '...' : 'Not provided'}`, 'green');
  }

  // 4. Test Protected Endpoint
  if (accessToken) {
    const profile = await testEndpoint('Get User Profile', 'GET', '/api/user/profile', null, {
      'Authorization': `Bearer ${accessToken}`
    });
    if (profile) {
      log(`  Profile Email: ${profile.profile.email}`, 'green');
    }
  }

  // 5. Test Invalid Login
  await testEndpoint('Invalid Login', 'POST', '/api/auth/login', {
    email: testUser.email,
    password: 'WrongPassword'
  });

  // 6. Test Rate Limiting
  log('\nTesting Rate Limiting...', 'blue');
  for (let i = 0; i < 6; i++) {
    const result = await testEndpoint(`Login Attempt ${i + 1}`, 'POST', '/api/auth/login', {
      email: 'ratelimit@test.com',
      password: 'wrong'
    });
    if (!result && i === 5) {
      log('  Rate limiting is working correctly', 'green');
    }
  }

  // 7. Test Token Refresh
  if (refreshToken) {
    const refresh = await testEndpoint('Token Refresh', 'POST', '/api/auth/refresh', {
      refreshToken
    });
    if (refresh && refresh.token) {
      log(`  New Access Token: ${refresh.token.substring(0, 20)}...`, 'green');
    }
  }

  log('\n' + '='.repeat(50), 'yellow');
  log('Tests completed!', 'yellow');
}

// Run tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});