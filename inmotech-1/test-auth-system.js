/**
 * Comprehensive Authentication System Test
 * Tests all auth endpoints and security features
 */

const BASE_URL = 'http://localhost:3001/api';

async function testAuthSystem() {
  console.log('🔐 Testing Complete Authentication System');
  console.log('==========================================\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logResult(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName} ${details}`);
    results.tests.push({ testName, passed, details });
    if (passed) results.passed++;
    else results.failed++;
  }

  // Test 1: Registration
  console.log('📝 Testing Registration...');
  try {
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        acceptTerms: true
      })
    });
    
    const registerData = await registerResponse.json();
    logResult('Registration endpoint', registerResponse.status === 201, 
      `Status: ${registerResponse.status}`);
    
    if (registerData.user && registerData.user.email) {
      logResult('Registration returns user data', true);
    } else {
      logResult('Registration returns user data', false, 'No user data returned');
    }
  } catch (error) {
    logResult('Registration endpoint', false, `Error: ${error.message}`);
  }

  // Test 2: Login
  console.log('\n🔑 Testing Login...');
  let accessToken = null;
  try {
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'investor@demo.com', // Use seeded user
        password: 'investor123!'
      })
    });
    
    const loginData = await loginResponse.json();
    logResult('Login endpoint', loginResponse.status === 200, 
      `Status: ${loginResponse.status}`);
    
    if (loginData.accessToken) {
      accessToken = loginData.accessToken;
      logResult('Login returns access token', true);
    } else {
      logResult('Login returns access token', false, 'No access token returned');
    }
    
    if (loginData.user && !loginData.user.password) {
      logResult('Login excludes password from response', true);
    } else {
      logResult('Login excludes password from response', false, 'Password exposed');
    }
  } catch (error) {
    logResult('Login endpoint', false, `Error: ${error.message}`);
  }

  // Test 3: Get Current User
  console.log('\n👤 Testing Get Current User...');
  if (accessToken) {
    try {
      const meResponse = await fetch(`${BASE_URL}/user/me`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const meData = await meResponse.json();
      logResult('Get current user endpoint', meResponse.status === 200, 
        `Status: ${meResponse.status}`);
      
      if (meData.user && meData.user.summary) {
        logResult('Returns user with investment summary', true);
      } else {
        logResult('Returns user with investment summary', false, 'No summary data');
      }
    } catch (error) {
      logResult('Get current user endpoint', false, `Error: ${error.message}`);
    }
  } else {
    logResult('Get current user endpoint', false, 'No access token for test');
  }

  // Test 4: Protected Route Without Token
  console.log('\n🛡️ Testing Route Protection...');
  try {
    const protectedResponse = await fetch(`${BASE_URL}/user/me`);
    logResult('Protected route blocks unauthorized access', 
      protectedResponse.status === 401, `Status: ${protectedResponse.status}`);
  } catch (error) {
    logResult('Protected route blocks unauthorized access', false, `Error: ${error.message}`);
  }

  // Test 5: Forgot Password
  console.log('\n🔐 Testing Forgot Password...');
  try {
    const forgotResponse = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'investor@demo.com'
      })
    });
    
    const forgotData = await forgotResponse.json();
    logResult('Forgot password endpoint', forgotResponse.status === 200, 
      `Status: ${forgotResponse.status}`);
    
    if (forgotData.message && !forgotData.error) {
      logResult('Forgot password returns success message', true);
    } else {
      logResult('Forgot password returns success message', false, 'No success message');
    }
  } catch (error) {
    logResult('Forgot password endpoint', false, `Error: ${error.message}`);
  }

  // Test 6: Refresh Token
  console.log('\n🔄 Testing Token Refresh...');
  try {
    const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Note: This might fail if no refresh token cookie is set
    logResult('Refresh token endpoint exists', 
      refreshResponse.status === 401 || refreshResponse.status === 200, 
      `Status: ${refreshResponse.status} (401 expected without cookie)`);
  } catch (error) {
    logResult('Refresh token endpoint exists', false, `Error: ${error.message}`);
  }

  // Test 7: Input Validation
  console.log('\n✅ Testing Input Validation...');
  try {
    const invalidLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: ''
      })
    });
    
    logResult('Input validation blocks invalid data', 
      invalidLoginResponse.status === 400, 
      `Status: ${invalidLoginResponse.status}`);
  } catch (error) {
    logResult('Input validation blocks invalid data', false, `Error: ${error.message}`);
  }

  // Test 8: Rate Limiting (Forgot Password)
  console.log('\n⏰ Testing Rate Limiting...');
  try {
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@ratelimit.com' })
      }));
    }
    
    const responses = await Promise.all(requests);
    const hasRateLimit = responses.some(r => r.status === 429);
    
    logResult('Rate limiting implemented', hasRateLimit, 
      hasRateLimit ? 'Rate limit triggered' : 'No rate limit detected');
  } catch (error) {
    logResult('Rate limiting implemented', false, `Error: ${error.message}`);
  }

  // Test 9: User Profile Update
  console.log('\n📝 Testing Profile Update...');
  if (accessToken) {
    try {
      const updateResponse = await fetch(`${BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: 'Updated',
          lastName: 'Name'
        })
      });
      
      logResult('Profile update endpoint', updateResponse.status === 200, 
        `Status: ${updateResponse.status}`);
    } catch (error) {
      logResult('Profile update endpoint', false, `Error: ${error.message}`);
    }
  } else {
    logResult('Profile update endpoint', false, 'No access token for test');
  }

  // Test 10: Logout
  console.log('\n🚪 Testing Logout...');
  if (accessToken) {
    try {
      const logoutResponse = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      logResult('Logout endpoint', logoutResponse.status === 200, 
        `Status: ${logoutResponse.status}`);
    } catch (error) {
      logResult('Logout endpoint', false, `Error: ${error.message}`);
    }
  } else {
    logResult('Logout endpoint', false, 'No access token for test');
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  const criticalTests = [
    'Registration endpoint',
    'Login endpoint', 
    'Get current user endpoint',
    'Protected route blocks unauthorized access',
    'Input validation blocks invalid data'
  ];

  const criticalPassed = results.tests
    .filter(t => criticalTests.includes(t.testName) && t.passed)
    .length;

  console.log(`\n🎯 Critical Tests: ${criticalPassed}/${criticalTests.length} passed`);

  if (criticalPassed === criticalTests.length) {
    console.log('\n🎉 AUTH FOUNDATION ✅ READY FOR FRONTEND 🚀');
  } else {
    console.log('\n⚠️  Some critical tests failed. Please review before proceeding.');
  }
}

// Run tests
testAuthSystem().catch(console.error);