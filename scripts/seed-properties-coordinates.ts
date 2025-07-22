import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample properties with Madrid coordinates
const SAMPLE_PROPERTIES = [
  {
    title: 'Modern Apartment in Malasaña',
    description: 'Beautiful 2-bedroom apartment in the heart of Madrid\'s trendiest neighborhood.',
    address: 'Calle de Fuencarral, 45',
    city: 'Madrid',
    country: 'Spain',
    postalCode: '28004',
    latitude: 40.4237,
    longitude: -3.7018,
    propertyType: 'apartment',
    listingType: 'sale',
    bedrooms: 2,
    bathrooms: 1,
    totalArea: 75,
    salePrice: 450000,
    currency: 'EUR',
    yearBuilt: 2018,
    condition: 'excellent'
  },
  {
    title: 'Luxury Penthouse in Salamanca',
    description: 'Exclusive penthouse with terrace in Madrid\'s most prestigious district.',
    address: 'Calle de Serrano, 123',
    city: 'Madrid',
    country: 'Spain',
    postalCode: '28006',
    latitude: 40.4319,
    longitude: -3.6844,
    propertyType: 'apartment',
    listingType: 'sale',
    bedrooms: 4,
    bathrooms: 3,
    totalArea: 180,
    salePrice: 1250000,
    currency: 'EUR',
    yearBuilt: 2020,
    condition: 'excellent',
    isFeatured: true
  },
  {
    title: 'Cozy Studio near Retiro Park',
    description: 'Perfect studio for young professionals, close to the park and metro.',
    address: 'Calle de Alcalá, 67',
    city: 'Madrid',
    country: 'Spain',
    postalCode: '28009',
    latitude: 40.4211,
    longitude: -3.6844,
    propertyType: 'apartment',
    listingType: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    totalArea: 35,
    rentPrice: 1200,
    currency: 'EUR',
    yearBuilt: 1960,
    condition: 'good'
  },
  {
    title: 'Family House in Las Rozas',
    description: 'Spacious family home with garden in peaceful suburban area.',
    address: 'Calle de la Constitución, 15',
    city: 'Las Rozas',
    country: 'Spain',
    postalCode: '28232',
    latitude: 40.4925,
    longitude: -3.8738,
    propertyType: 'house',
    listingType: 'sale',
    bedrooms: 5,
    bathrooms: 3,
    totalArea: 220,
    plotSize: 400,
    salePrice: 650000,
    currency: 'EUR',
    yearBuilt: 1995,
    condition: 'good'
  },
  {
    title: 'Commercial Space in Gran Via',
    description: 'Prime commercial location on Madrid\'s main shopping street.',
    address: 'Gran Vía, 28',
    city: 'Madrid',
    country: 'Spain',
    postalCode: '28013',
    latitude: 40.4213,
    longitude: -3.7067,
    propertyType: 'commercial',
    listingType: 'rent',
    totalArea: 120,
    rentPrice: 4500,
    currency: 'EUR',
    yearBuilt: 1920,
    condition: 'needs_renovation'
  },
  {
    title: 'New Development in Valdebebas',
    description: 'Modern apartment in new residential complex with amenities.',
    address: 'Avenida de Valdebebas, 8',
    city: 'Madrid',
    country: 'Spain',
    postalCode: '28049',
    latitude: 40.4833,
    longitude: -3.6167,
    propertyType: 'apartment',
    listingType: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    totalArea: 95,
    salePrice: 385000,
    currency: 'EUR',
    yearBuilt: 2023,
    condition: 'new_construction',
    isFeatured: true
  },
  {
    title: 'Charming Loft in Chueca',
    description: 'Unique loft space in vibrant LGBTQ+ friendly neighborhood.',
    address: 'Calle de Gravina, 12',
    city: 'Madrid',
    country: 'Spain',
    postalCode: '28004',
    latitude: 40.4242,
    longitude: -3.6956,
    propertyType: 'apartment',
    listingType: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    totalArea: 65,
    rentPrice: 1800,
    currency: 'EUR',
    yearBuilt: 2000,
    condition: 'excellent'
  },
  {
    title: 'Investment Property in Carabanchel',
    description: 'Great investment opportunity in upcoming area with metro access.',
    address: 'Calle de Oporto, 45',
    city: 'Madrid',
    country: 'Spain',
    postalCode: '28019',
    latitude: 40.3889,
    longitude: -3.7206,
    propertyType: 'apartment',
    listingType: 'sale',
    bedrooms: 2,
    bathrooms: 1,
    totalArea: 68,
    salePrice: 195000,
    currency: 'EUR',
    yearBuilt: 1980,
    condition: 'good',
    isInvestmentProperty: true
  },
  {
    title: 'Luxury Villa in Pozuelo',
    description: 'Exclusive villa with pool and garden in prestigious area.',
    address: 'Calle de los Olivos, 23',
    city: 'Pozuelo de Alarcón',
    country: 'Spain',
    postalCode: '28223',
    latitude: 40.4361,
    longitude: -3.8122,
    propertyType: 'house',
    listingType: 'sale',
    bedrooms: 6,
    bathrooms: 4,
    totalArea: 380,
    plotSize: 800,
    salePrice: 1850000,
    currency: 'EUR',
    yearBuilt: 2010,
    condition: 'excellent',
    isFeatured: true
  },
  {
    title: 'Student Apartment near Universidad Complutense',
    description: 'Perfect for students, close to university and transport.',
    address: 'Avenida de la Complutense, 12',
    city: 'Madrid',
    country: 'Spain',
    postalCode: '28040',
    latitude: 40.4489,
    longitude: -3.7278,
    propertyType: 'apartment',
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 1,
    totalArea: 55,
    rentPrice: 950,
    currency: 'EUR',
    yearBuilt: 1970,
    condition: 'good'
  }
];

async function seedPropertiesWithCoordinates() {
  console.log('🌍 Seeding properties with coordinates...');

  try {
    // Find a user to be the owner (you might need to create one first)
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`👤 Using user ${user.firstName} ${user.lastName} as owner`);

    for (const propertyData of SAMPLE_PROPERTIES) {
      const property = await prisma.property.create({
        data: {
          ...propertyData,
          ownerId: user.id,
          isPublished: true,
          publishedAt: new Date(),
          views: Math.floor(Math.random() * 100),
          inquiries: Math.floor(Math.random() * 20),
          // Add some random features
          features: {
            parking: Math.random() > 0.5,
            elevator: propertyData.propertyType === 'apartment' && Math.random() > 0.3,
            terrace: Math.random() > 0.6,
            airConditioning: Math.random() > 0.4,
            heating: Math.random() > 0.2,
            furnished: propertyData.listingType === 'rent' && Math.random() > 0.5,
            pool: propertyData.propertyType === 'house' && Math.random() > 0.7,
            garden: propertyData.propertyType === 'house' && Math.random() > 0.5,
            gym: Math.random() > 0.8,
            security: Math.random() > 0.6
          },
          // Add sample images (you can replace with real URLs)
          images: [
            `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop`,
            `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop`,
            `https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop`
          ]
        }
      });

      console.log(`✅ Created: ${property.title} at (${property.latitude}, ${property.longitude})`);
    }

    console.log('🎉 Successfully seeded all properties with coordinates!');
    
  } catch (error) {
    console.error('❌ Error seeding properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedPropertiesWithCoordinates();
}

export default seedPropertiesWithCoordinates;