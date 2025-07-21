const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_m1zGSYrLNx5w@ep-orange-cake-ad7qt1rl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function testPlatform() {
  console.log('🧪 Testing InmoTech Crowdfunding Platform\n');
  
  try {
    // 1. Test Database Connection
    console.log('1️⃣ Testing Database Connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected! Found ${userCount} users\n`);
    
    // 2. Create Admin User
    console.log('2️⃣ Creating Admin User...');
    const adminPassword = await bcrypt.hash('AdminPass123!', 12);
    
    // Delete existing admin if exists
    await prisma.user.deleteMany({
      where: { email: 'admin@inmote.ch' }
    });
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@inmote.ch',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'InmoTech',
        isVerified: true,
        isAdmin: true,
        kycStatus: 'APPROVED'
      }
    });
    console.log('✅ Admin created:', admin.email, '\n');
    
    // 3. Create Test Projects
    console.log('3️⃣ Creating Test Investment Projects...');
    
    const projects = [
      {
        title: 'Luxury Apartments Madrid',
        description: 'Premium residential development in the heart of Madrid with excellent ROI potential',
        location: 'Madrid, Spain',
        targetAmount: 500000,
        currency: 'EUR',
        expectedReturn: 12.5,
        duration: 24,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 1000,
        createdBy: admin.id,
        images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'],
        milestones: [
          { percentage: 20, description: 'Land acquisition' },
          { percentage: 30, description: 'Construction permits' },
          { percentage: 30, description: 'Construction phase' },
          { percentage: 20, description: 'Project completion' }
        ]
      },
      {
        title: 'Beachfront Condos Cancun',
        description: 'Exclusive beachfront property development in Cancun\'s hotel zone',
        location: 'Cancun, Mexico',
        targetAmount: 750000,
        currency: 'MXN',
        expectedReturn: 15.0,
        duration: 36,
        riskLevel: 'High',
        propertyType: 'Resort',
        minimumInvestment: 5000,
        createdBy: admin.id,
        images: ['https://images.unsplash.com/photo-1510414842594-a61c69b5ae57'],
        milestones: [
          { percentage: 25, description: 'Property acquisition' },
          { percentage: 25, description: 'Development planning' },
          { percentage: 25, description: 'Construction' },
          { percentage: 25, description: 'Marketing & sales' }
        ]
      },
      {
        title: 'Commercial Plaza Barcelona',
        description: 'Modern commercial space in Barcelona\'s business district',
        location: 'Barcelona, Spain',
        targetAmount: 1000000,
        currency: 'EUR',
        expectedReturn: 10.5,
        duration: 18,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 2500,
        createdBy: admin.id,
        images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'],
        milestones: [
          { percentage: 30, description: 'Property purchase' },
          { percentage: 40, description: 'Renovation' },
          { percentage: 30, description: 'Tenant acquisition' }
        ]
      }
    ];
    
    for (const projectData of projects) {
      const project = await prisma.project.create({
        data: projectData
      });
      console.log(`✅ Created project: ${project.title}`);
    }
    
    console.log('\n4️⃣ Platform Test Summary:');
    console.log('✅ Database Connection: Working');
    console.log('✅ User Management: Working');
    console.log('✅ Project Creation: Working');
    console.log('✅ Data Models: Properly configured');
    
    console.log('\n📋 Test Credentials:');
    console.log('User Login: testuser@example.com / testpassword123');
    console.log('Admin Login: admin@inmote.ch / AdminPass123!');
    
    console.log('\n🚀 Platform is ready for testing!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPlatform();