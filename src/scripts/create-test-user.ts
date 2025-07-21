#!/usr/bin/env tsx

/**
 * Create Test User Script
 * Creates a simple test user for login testing
 */

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🧪 Creating test user...');

    const email = 'test@example.com';
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  Test user already exists');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      return;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
        isAdmin: false,
        kycStatus: 'PENDING'
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name: Test User');
    console.log('');
    console.log('🔗 Test with these credentials at:');
    console.log('   https://inmotech-otgtc5a4x-kaufasts-projects.vercel.app/en-GB/login');
    console.log('');
    console.log('💡 Or use the test HTML file: open test-login.html');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();