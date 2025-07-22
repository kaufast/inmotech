// @ts-ignore - Skip type checking for node-fetch in build
import fetch from 'node-fetch';

interface TestCase {
  name: string;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number;
  description: string;
}

class APITester {
  baseUrl: string;
  private results: Array<{ name: string; passed: boolean; message: string; response?: any }> = [];

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async runTests() {
    console.log('🚀 Starting API Endpoint Tests...\n');

    const testCases: TestCase[] = [
      // Auth Tests
      {
        name: 'User Registration',
        endpoint: '/api/auth/register',
        method: 'POST',
        body: {
          email: 'test.api@inmotech.com',
          password: 'TestPassword123!',
          firstName: 'API',
          lastName: 'Test'
        },
        expectedStatus: 201,
        description: 'Should create a new user account'
      },
      {
        name: 'User Login',
        endpoint: '/api/auth/login',
        method: 'POST',
        body: {
          email: 'test.api@inmotech.com',
          password: 'TestPassword123!'
        },
        expectedStatus: 200,
        description: 'Should authenticate user and return tokens'
      },

      // RBAC Tests
      {
        name: 'Get User Permissions (Unauthenticated)',
        endpoint: '/api/auth/permissions',
        method: 'GET',
        expectedStatus: 401,
        description: 'Should require authentication'
      },

      // Projects Tests
      {
        name: 'Get All Projects',
        endpoint: '/api/projects',
        method: 'GET',
        expectedStatus: 200,
        description: 'Should return list of projects'
      },

      // Dashboard Analytics Tests
      {
        name: 'Get Dashboard Analytics (Unauthenticated)',
        endpoint: '/api/dashboard/analytics',
        method: 'GET',
        expectedStatus: 401,
        description: 'Should require authentication'
      },

      // Watchlist Tests
      {
        name: 'Get User Watchlist (Unauthenticated)',
        endpoint: '/api/user/watchlist',
        method: 'GET',
        expectedStatus: 401,
        description: 'Should require authentication'
      },

      // Admin Tests
      {
        name: 'Get Admin Roles (Unauthenticated)',
        endpoint: '/api/admin/roles',
        method: 'GET',
        expectedStatus: 401,
        description: 'Should require admin authentication'
      }
    ];

    for (const testCase of testCases) {
      await this.runTest(testCase);
    }

    this.printResults();
  }

  async runTest(testCase: TestCase) {
    try {
      const url = `${this.baseUrl}${testCase.endpoint}`;
      const options: any = {
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json',
          ...testCase.headers
        }
      };

      if (testCase.body) {
        options.body = JSON.stringify(testCase.body);
      }

      console.log(`🧪 Testing: ${testCase.name}`);
      console.log(`   ${testCase.method} ${testCase.endpoint}`);
      console.log(`   Expected: ${testCase.description}`);

      const response = await fetch(url, options);
      const responseData = await response.text();
      let jsonData;
      
      try {
        jsonData = JSON.parse(responseData);
      } catch {
        jsonData = responseData;
      }

      const expectedStatus = testCase.expectedStatus || 200;
      const passed = response.status === expectedStatus;

      this.results.push({
        name: testCase.name,
        passed,
        message: `Status: ${response.status} (expected ${expectedStatus})`,
        response: jsonData
      });

      console.log(`   Result: ${passed ? '✅ PASS' : '❌ FAIL'} - Status: ${response.status}`);
      if (!passed) {
        console.log(`   Response: ${JSON.stringify(jsonData, null, 2)}`);
      }
      console.log();

    } catch (error) {
      console.log(`   Result: ❌ FAIL - Error: ${error}`);
      this.results.push({
        name: testCase.name,
        passed: false,
        message: `Network error: ${error}`
      });
      console.log();
    }
  }

  printResults() {
    console.log('='.repeat(60));
    console.log('📋 API TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.name}: ${result.message}`);
      });
    }
  }
}

// Authenticated API Tester - tests endpoints that require authentication
class AuthenticatedAPITester extends APITester {
  private authToken: string | null = null;

  async runAuthenticatedTests() {
    console.log('🔐 Starting Authenticated API Tests...\n');

    // First, authenticate
    await this.authenticate();

    if (!this.authToken) {
      console.log('❌ Could not authenticate - skipping authenticated tests');
      return;
    }

    const authenticatedTests: TestCase[] = [
      {
        name: 'Get User Permissions (Authenticated)',
        endpoint: '/api/auth/permissions',
        method: 'GET',
        expectedStatus: 200,
        description: 'Should return user permissions'
      },
      {
        name: 'Get Dashboard Analytics (Authenticated)',
        endpoint: '/api/dashboard/analytics',
        method: 'GET',
        expectedStatus: 200,
        description: 'Should return dashboard data'
      },
      {
        name: 'Get User Watchlist (Authenticated)',
        endpoint: '/api/user/watchlist',
        method: 'GET',
        expectedStatus: 200,
        description: 'Should return user watchlist'
      },
      {
        name: 'Get User Preferences (Authenticated)',
        endpoint: '/api/user/preferences',
        method: 'GET',
        expectedStatus: 200,
        description: 'Should return user preferences'
      },
      {
        name: 'Create Investment (Test)',
        endpoint: '/api/investments',
        method: 'POST',
        body: {
          projectId: 'test-project-id',
          amount: 1000,
          paymentMethod: 'test',
          paymentDetails: { test: true }
        },
        expectedStatus: 400, // Expected to fail due to missing project
        description: 'Should validate project exists'
      }
    ];

    for (const testCase of authenticatedTests) {
      testCase.headers = {
        ...testCase.headers,
        'Authorization': `Bearer ${this.authToken}`
      };
      await this.runTest(testCase);
    }

    this.printResults();
  }

  private async authenticate() {
    try {
      console.log('🔑 Authenticating test user...');
      
      // Try to create test user first
      await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'auth.test@inmotech.com',
          password: 'TestAuth123!',
          firstName: 'Auth',
          lastName: 'Test'
        })
      });

      // Login
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'auth.test@inmotech.com',
          password: 'TestAuth123!'
        })
      });

      if (response.ok) {
        const data = await response.json() as any;
        this.authToken = data.accessToken;
        console.log('✅ Authentication successful\n');
      } else {
        console.log('❌ Authentication failed\n');
      }
    } catch (error) {
      console.log('❌ Authentication error:', error);
    }
  }
}

// Load Testing Script
class LoadTester {
  baseUrl: string;
  
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async runLoadTests() {
    console.log('⚡ Starting Load Tests...\n');

    const endpoints = [
      '/api/projects',
      '/api/dashboard/analytics',
      '/api/user/watchlist'
    ];

    const concurrentRequests = 10;
    const requestsPerEndpoint = 5;

    for (const endpoint of endpoints) {
      console.log(`🎯 Load testing: ${endpoint}`);
      await this.testEndpointLoad(endpoint, concurrentRequests, requestsPerEndpoint);
    }
  }

  private async testEndpointLoad(endpoint: string, concurrent: number, total: number) {
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrent; i++) {
      promises.push(this.makeMultipleRequests(endpoint, Math.ceil(total / concurrent)));
    }

    try {
      const results = await Promise.all(promises);
      const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`   Requests: ${totalRequests}`);
      console.log(`   Errors: ${totalErrors}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Avg Response Time: ${(duration / totalRequests).toFixed(2)}ms`);
      console.log(`   Success Rate: ${((totalRequests - totalErrors) / totalRequests * 100).toFixed(1)}%`);
      console.log();
    } catch (error) {
      console.log(`   Load test failed: ${error}\n`);
    }
  }

  private async makeMultipleRequests(endpoint: string, count: number) {
    let requests = 0;
    let errors = 0;

    for (let i = 0; i < count; i++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        requests++;
        if (!response.ok) {
          errors++;
        }
      } catch {
        requests++;
        errors++;
      }
    }

    return { requests, errors };
  }
}

// Main execution
async function runAllTests() {
  console.log('🧪 InmoTech Platform Test Suite');
  console.log('================================\n');

  const basicTester = new APITester();
  await basicTester.runTests();

  console.log('\n');

  const authTester = new AuthenticatedAPITester();
  await authTester.runAuthenticatedTests();

  console.log('\n');

  const loadTester = new LoadTester();
  await loadTester.runLoadTests();

  console.log('🏁 All tests completed!');
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

export { APITester, AuthenticatedAPITester, LoadTester };