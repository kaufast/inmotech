import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hash('admin123!Admin', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      kycStatus: 'APPROVED',
      isEmailVerified: true,
      investmentLimit: 1000000, // €1M limit for admin
    },
  });

  // Create demo investor
  const investorPassword = await hash('investor123!', 12);
  const investorUser = await prisma.user.upsert({
    where: { email: 'investor@demo.com' },
    update: {},
    create: {
      email: 'investor@demo.com',
      password: investorPassword,
      firstName: 'Demo',
      lastName: 'Investor',
      role: 'USER',
      kycStatus: 'APPROVED',
      isEmailVerified: true,
      investmentLimit: 100000, // €100K limit
    },
  });

  // Create sample properties with fixed IDs
  const properties = [
    {
      id: 'madrid-luxury-penthouse',
      title: 'Luxury Penthouse Madrid',
      description: 'Prime location penthouse with panoramic city views in Madrid\'s most exclusive district. Features include a private rooftop terrace, smart home technology, and premium finishes throughout.',
      location: 'Salamanca District, Madrid, Spain',
      totalValue: 850000,
      minInvestment: 10000,
      targetFunding: 850000,
      currentFunding: 646000, // 76% funded
      expectedReturn: 12.0,
      investmentTerm: 18,
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600',
      ]),
    },
    {
      id: 'barcelona-smart-apartment',
      title: 'Smart Apartment Barcelona',
      description: 'Modern apartment in Barcelona\'s grid district with smart home technology and excellent tourist rental potential. Located walking distance to Gaudí sites.',
      location: 'Eixample, Barcelona, Spain',
      totalValue: 520000,
      minInvestment: 5000,
      targetFunding: 520000,
      currentFunding: 234000, // 45% funded
      expectedReturn: 10.0,
      investmentTerm: 24,
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600',
        'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=600',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600',
      ]),
    },
    {
      id: 'valencia-beachfront-condo',
      title: 'Beachfront Condo Valencia',
      description: 'Stunning beachfront property near Valencia\'s iconic City of Arts and Sciences. New development with direct beach access and growing tech hub nearby.',
      location: 'City of Arts, Valencia, Spain',
      totalValue: 380000,
      minInvestment: 3000,
      targetFunding: 380000,
      currentFunding: 87400, // 23% funded
      expectedReturn: 14.0,
      investmentTerm: 12,
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600',
      ]),
    },
  ];

  for (const propertyData of properties) {
    await prisma.property.upsert({
      where: { id: propertyData.id },
      update: {},
      create: propertyData,
    });
  }

  // Create some sample investments using the known property IDs
  await prisma.investment.upsert({
    where: {
      id: 'demo-investment-1',
    },
    update: {},
    create: {
      id: 'demo-investment-1',
      userId: investorUser.id,
      propertyId: 'madrid-luxury-penthouse',
      amount: 25000,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  await prisma.investment.upsert({
    where: {
      id: 'demo-investment-2',
    },
    update: {},
    create: {
      id: 'demo-investment-2',
      userId: investorUser.id,
      propertyId: 'barcelona-smart-apartment',
      amount: 15000,
      status: 'PENDING',
    },
  });

  // Update user's total invested amount
  await prisma.user.update({
    where: { id: investorUser.id },
    data: { totalInvested: 40000 },
  });

  // Create audit log entries
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'DATABASE_SEEDED',
      resource: 'SYSTEM',
      details: JSON.stringify({
        message: 'Database seeded with initial data',
        properties: properties.length,
        users: 2,
        investments: 2,
      }),
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Demo Accounts:');
  console.log('👤 Admin: admin@platform.com / admin123!Admin');
  console.log('👤 Investor: investor@demo.com / investor123!');
  console.log('\n🏠 Properties created:', properties.length);
  console.log('💰 Sample investments created: 2');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });