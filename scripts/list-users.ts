#!/usr/bin/env tsx

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('👥 All registered users:\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    users.forEach((user, index) => {
      const adminBadge = user.isAdmin ? '👑' : '👤';
      const verifiedBadge = user.isVerified ? '✅' : '⏳';
      console.log(`${index + 1}. ${adminBadge} ${verifiedBadge} ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Admin: ${user.isAdmin}`);
      console.log(`   Verified: ${user.isVerified}`);
      console.log(`   Registered: ${user.createdAt.toLocaleDateString()}\n`);
    });

    console.log(`📊 Total users: ${users.length}`);
    
    // Check for kaufast variants
    console.log('\n🔍 Checking for kaufast email variants...');
    const kaufastUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'kaufast'
        }
      }
    });

    if (kaufastUsers.length > 0) {
      kaufastUsers.forEach(user => {
        console.log(`   Found: ${user.email} - ${user.firstName} ${user.lastName}`);
      });
    } else {
      console.log('   No users found with "kaufast" in email');
    }

  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the list
listUsers()
  .then(() => {
    console.log('\n✨ User listing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to list users:', error);
    process.exit(1);
  });