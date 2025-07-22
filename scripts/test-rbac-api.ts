#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { verifyPassword, createSecureJWT } from '../src/lib/edge-crypto';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

interface TestUser {
  email: string;
  password: string;
  expectedRole: string;
}

const testUsers: TestUser[] = [
  { email: 'test@example.com', password: 'password123', expectedRole: 'property_manager' },
  { email: 'kennethmelchor@gmail.com', password: 'password123', expectedRole: 'analyst' }, 
  { email: 'user@test.com', password: 'password123', expectedRole: 'investor' }
];

async function getJWTToken(email: string, password: string): Promise<string | null> {
  try {
    // Simulate the login process
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !await verifyPassword(password, user.password)) {
      return null;
    }

    // Build role and permission arrays
    const userRoles: string[] = [];
    const allPermissions: string[] = [];

    user.userRoles.forEach(userRole => {
      userRoles.push(userRole.role.name);
      const permissions = userRole.role.rolePermissions.map(rp => rp.permission.name);
      allPermissions.push(...permissions);
    });

    // Create JWT with roles and permissions
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      roles: userRoles,
      permissions: Array.from(new Set(allPermissions))
    };

    return await createSecureJWT(jwtPayload, '7d');
  } catch (error) {
    console.error('Error getting JWT token:', error);
    return null;
  }
}

async function testAPIEndpoint(method: string, endpoint: string, token: string, body?: any): Promise<any> {
  const baseUrl = 'http://localhost:3001';
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const options: RequestInit = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const result = await response.json();
    
    return {
      status: response.status,
      success: response.ok,
      data: result
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runRBACTests() {
  console.log('🧪 RBAC API Testing Suite');
  console.log('==========================\n');

  for (const testUser of testUsers) {
    console.log(`\n👤 Testing user: ${testUser.email} (${testUser.expectedRole})`);
    console.log('='.repeat(60));

    // Get JWT token
    const token = await getJWTToken(testUser.email, testUser.password);
    if (!token) {
      console.log('❌ Failed to get JWT token');
      continue;
    }
    console.log('✅ JWT token obtained');

    // Test scenarios based on role
    const testScenarios = [
      {
        name: 'GET Projects (public)',
        method: 'GET',
        endpoint: '/api/projects',
        expectedSuccess: true
      },
      {
        name: 'POST Projects (create)',
        method: 'POST', 
        endpoint: '/api/projects',
        body: {
          title: `Test Project by ${testUser.expectedRole}`,
          description: 'A test project to validate RBAC',
          location: 'Madrid, Spain',
          targetAmount: 100000,
          expectedReturn: 10,
          duration: 12,
          riskLevel: 'MEDIUM',
          propertyType: 'RESIDENTIAL'
        },
        expectedSuccess: testUser.expectedRole === 'property_manager' || testUser.expectedRole === 'admin'
      }
    ];

    for (const scenario of testScenarios) {
      console.log(`\n  🔍 ${scenario.name}`);
      
      const result = await testAPIEndpoint(
        scenario.method,
        scenario.endpoint,
        token,
        scenario.body
      );
      
      if (scenario.expectedSuccess && result.success) {
        console.log(`  ✅ Expected success: ${result.status}`);
      } else if (!scenario.expectedSuccess && !result.success) {
        console.log(`  ✅ Expected failure: ${result.status} - ${result.data?.error || 'Forbidden'}`);
      } else if (scenario.expectedSuccess && !result.success) {
        console.log(`  ❌ Unexpected failure: ${result.status} - ${result.data?.error || result.error}`);
      } else {
        console.log(`  ⚠️  Unexpected success: ${result.status}`);
        console.log(`     This user should not have access to this endpoint`);
      }

      if (result.data && Object.keys(result.data).length > 0 && result.status < 400) {
        console.log(`     Response keys: ${Object.keys(result.data).join(', ')}`);
      }
    }
  }

  console.log('\n🎯 RBAC Test Summary');
  console.log('====================');
  console.log('✅ property_manager should be able to create projects');
  console.log('❌ analyst should NOT be able to create projects'); 
  console.log('❌ investor should NOT be able to create projects');
  console.log('✅ All users should be able to view projects (public endpoint)');
}

async function main() {
  try {
    await runRBACTests();
  } catch (error) {
    console.error('Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}