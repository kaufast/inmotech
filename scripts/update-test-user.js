const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Update existing test user
    const user = await prisma.user.update({
      where: { email: 'test@example.com' },
      data: {
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        kycStatus: 'APPROVED',
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    console.log('Test user updated successfully:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    });
    
    console.log('\nYou can now login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error updating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestUser();