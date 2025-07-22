#!/usr/bin/env tsx

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

const SUPERADMIN_EMAILS = [
  'kennethmelchor@gmail.com',
  'kaufast@gmail.com'
];

async function promoteSuperAdmins() {
  try {
    console.log('🔧 Promoting users to superadmin status...\n');

    for (const email of SUPERADMIN_EMAILS) {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      // Update user to admin status
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { 
          isAdmin: true
        }
      });

      console.log(`✅ Promoted ${email} to superadmin`);
      console.log(`   - ID: ${updatedUser.id}`);
      console.log(`   - Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
      console.log(`   - IsAdmin: ${updatedUser.isAdmin}\n`);
    }

    // Verify current admin users
    console.log('📊 Current admin users:');
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        createdAt: true
      }
    });

    adminUsers.forEach(admin => {
      console.log(`   👑 ${admin.firstName} ${admin.lastName} (${admin.email}) - Admin`);
    });

    console.log(`\n🎉 Total admin users: ${adminUsers.length}`);

  } catch (error) {
    console.error('❌ Error promoting superadmins:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the promotion
promoteSuperAdmins()
  .then(() => {
    console.log('\n✨ Superadmin promotion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to promote superadmins:', error);
    process.exit(1);
  });