const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_m1zGSYrLNx5w@ep-orange-cake-ad7qt1rl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function recreateAdmin() {
  try {
    console.log('🔑 Creating admin user...');
    
    // Update existing admin to make sure they have admin rights
    const admin = await prisma.user.upsert({
      where: { email: 'admin@inmote.ch' },
      update: {
        isAdmin: true,
        isVerified: true,
        kycStatus: 'APPROVED'
      },
      create: {
        email: 'admin@inmote.ch',
        password: await bcrypt.hash('AdminPass123!', 12),
        firstName: 'Admin',
        lastName: 'InmoTech',
        isVerified: true,
        isAdmin: true,
        kycStatus: 'APPROVED'
      }
    });
    
    console.log('✅ Admin created:', admin.email);
    console.log('   Password: AdminPass123!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

recreateAdmin();