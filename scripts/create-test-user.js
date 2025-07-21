const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
        isActive: true,
        kycStatus: 'APPROVED',
      },
    });

    console.log('Test user created successfully:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    
    console.log('\nYou can now login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('User already exists with email: test@example.com');
    } else {
      console.error('Error creating test user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();