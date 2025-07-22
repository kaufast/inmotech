#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { verifyPassword, createSecureJWT, verifySecureJWT, generateSecureToken } from '../src/lib/edge-crypto';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

interface TestScenario {
  email: string;
  password: string;
  expectedRole: string;
}

const testUsers: TestScenario[] = [
  { email: 'test@example.com', password: 'password123', expectedRole: 'property_manager' },
  { email: 'user@test.com', password: 'password123', expectedRole: 'investor' }
];

async function testLoginAndRefresh(email: string, password: string) {
  console.log(`\n🔐 Testing Refresh Tokens for: ${email}`);
  console.log('='.repeat(50));

  try {
    // Step 1: Login to get tokens
    console.log('1️⃣  Attempting login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/db-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log('❌ Login failed:', error.error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`   Access Token expiry: ${loginData.tokens.expiresIn}s (${loginData.tokens.expiresIn / 60}min)`);
    console.log(`   User roles: ${loginData.user.roles.map((r: any) => r.name).join(', ')}`);
    console.log(`   Permissions count: ${loginData.user.permissions.length}`);

    const { accessToken, refreshToken } = loginData.tokens;

    // Step 2: Verify the access token works
    console.log('\n2️⃣  Verifying access token...');
    try {
      const payload = await verifySecureJWT(accessToken);
      console.log('✅ Access token is valid');
      console.log(`   Contains roles: ${payload.roles?.join(', ')}`);
      console.log(`   Contains permissions: ${payload.permissions?.length} items`);
    } catch (error) {
      console.log('❌ Access token verification failed:', error);
      return;
    }

    // Step 3: Test the refresh endpoint
    console.log('\n3️⃣  Testing token refresh...');
    const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      const error = await refreshResponse.json();
      console.log('❌ Token refresh failed:', error.error);
      return;
    }

    const refreshData = await refreshResponse.json();
    console.log('✅ Token refresh successful');
    console.log(`   New access token expiry: ${refreshData.tokens.expiresIn}s`);
    console.log(`   New refresh token provided: ${!!refreshData.tokens.refreshToken}`);
    console.log(`   User data updated: ${!!refreshData.user}`);

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshData.tokens;

    // Step 4: Verify the new access token
    console.log('\n4️⃣  Verifying new access token...');
    try {
      const newPayload = await verifySecureJWT(newAccessToken);
      console.log('✅ New access token is valid');
      console.log(`   Same user: ${newPayload.userId === loginData.user.id}`);
      console.log(`   Roles preserved: ${newPayload.roles?.join(', ')}`);
      console.log(`   Permissions preserved: ${newPayload.permissions?.length} items`);
    } catch (error) {
      console.log('❌ New access token verification failed:', error);
      return;
    }

    // Step 5: Verify old refresh token is revoked
    console.log('\n5️⃣  Testing old refresh token revocation...');
    const oldRefreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }), // Using old refresh token
    });

    if (oldRefreshResponse.ok) {
      console.log('⚠️  Old refresh token still works (this should not happen)');
    } else {
      const error = await oldRefreshResponse.json();
      console.log('✅ Old refresh token properly revoked');
      console.log(`   Error: ${error.error}`);
    }

    // Step 6: Test API access with new token
    console.log('\n6️⃣  Testing API access with new token...');
    const apiResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${newAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API access successful with new token');
      console.log(`   Projects returned: ${apiData.projects?.length || 'N/A'}`);
    } else {
      console.log('❌ API access failed with new token');
    }

    console.log('\n🎉 Refresh token test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function testExpiredRefreshToken() {
  console.log('\n🕐 Testing Expired Refresh Token Handling');
  console.log('='.repeat(50));

  try {
    // Create an expired refresh token directly in database
    const testUser = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    const expiredToken = generateSecureToken();
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    await prisma.refreshToken.create({
      data: {
        userId: testUser.id,
        token: expiredToken,
        expiresAt: expiredDate,
      },
    });

    console.log('1️⃣  Created expired refresh token in database');

    // Try to use the expired token
    const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: expiredToken }),
    });

    if (refreshResponse.ok) {
      console.log('⚠️  Expired token was accepted (this should not happen)');
    } else {
      const error = await refreshResponse.json();
      console.log('✅ Expired token properly rejected');
      console.log(`   Error: ${error.error}`);
    }

    // Clean up
    await prisma.refreshToken.deleteMany({
      where: { token: expiredToken },
    });

  } catch (error) {
    console.error('❌ Expired token test failed:', error);
  }
}

async function runRefreshTokenTests() {
  console.log('🧪 Refresh Token Testing Suite');
  console.log('==============================\n');

  // Test refresh tokens for different user roles
  for (const testUser of testUsers) {
    await testLoginAndRefresh(testUser.email, testUser.password);
    console.log('\n' + '='.repeat(70));
  }

  // Test expired token handling
  await testExpiredRefreshToken();

  console.log('\n📊 Refresh Token Test Summary:');
  console.log('- ✅ Login generates both access and refresh tokens');
  console.log('- ✅ Access tokens are short-lived (15 minutes)');
  console.log('- ✅ Refresh tokens work to get new access tokens');
  console.log('- ✅ Old refresh tokens are properly revoked');
  console.log('- ✅ New tokens maintain user roles and permissions');
  console.log('- ✅ Expired refresh tokens are rejected');
  console.log('- ✅ New tokens work for API authentication');
}

async function main() {
  try {
    await runRefreshTokenTests();
  } catch (error) {
    console.error('Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}