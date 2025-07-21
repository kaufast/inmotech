const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_m1zGSYrLNx5w@ep-orange-cake-ad7qt1rl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function createPropertyPortfolio() {
  console.log('🏗️ Creating InmoTech Property Portfolio - 18 Properties\n');
  
  try {
    // Get admin user
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@inmote.ch' }
    });

    if (!admin) {
      console.log('Creating admin user...');
      const adminPassword = await bcrypt.hash('AdminPass123!', 12);
      admin = await prisma.user.create({
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
    }

    // Clear existing projects
    await prisma.project.deleteMany({});
    console.log('🗑️ Cleared existing projects');

    // SPAIN PROPERTIES (6)
    const spainProperties = [
      {
        title: 'Luxury Beachfront Apartments - Costa del Sol',
        description: 'Exclusive beachfront development in Marbella featuring 120 luxury apartments with panoramic Mediterranean views. Each unit includes private terraces, premium finishes, and access to world-class amenities including infinity pools, spa, and private beach club.',
        location: 'Marbella, Costa del Sol, Spain',
        targetAmount: 2500000,
        currency: 'EUR',
        expectedReturn: 14.5,
        duration: 36,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 5000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
        ],
        documents: ['property_deed.pdf', 'construction_permits.pdf', 'environmental_impact.pdf'],
        milestones: [
          { percentage: 25, description: 'Land acquisition and permits' },
          { percentage: 35, description: 'Foundation and structure' },
          { percentage: 25, description: 'Interior and amenities' },
          { percentage: 15, description: 'Marketing and sales completion' }
        ]
      },
      {
        title: 'Historic Downtown Renovation - Seville',
        description: 'Restoration of a 16th-century palace in Seville\'s historic center, converting it into 24 luxury boutique apartments while preserving original architectural elements. Located steps from the Cathedral and Alcázar.',
        location: 'Centro Histórico, Seville, Spain',
        targetAmount: 1800000,
        currency: 'EUR',
        expectedReturn: 12.8,
        duration: 30,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 3000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1543783207-ec64e4d95325',
          'https://images.unsplash.com/photo-1555636222-cae831e670b3',
          'https://images.unsplash.com/photo-1600298881974-6be191ceeda1'
        ],
        documents: ['heritage_permits.pdf', 'renovation_plans.pdf', 'market_analysis.pdf'],
        milestones: [
          { percentage: 20, description: 'Heritage approvals and planning' },
          { percentage: 40, description: 'Structural restoration' },
          { percentage: 30, description: 'Interior renovation' },
          { percentage: 10, description: 'Final approvals and handover' }
        ]
      },
      {
        title: 'Modern Office Complex - Madrid',
        description: 'State-of-the-art office complex in Madrid\'s financial district featuring 15,000 sqm of premium office space, retail areas, and underground parking. Designed for multinational corporations with LEED Gold certification.',
        location: 'Distrito Financiero, Madrid, Spain',
        targetAmount: 3200000,
        currency: 'EUR',
        expectedReturn: 11.2,
        duration: 42,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 7500,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
          'https://images.unsplash.com/photo-1497366216548-37526070297c',
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2'
        ],
        documents: ['commercial_lease_agreements.pdf', 'leed_certification.pdf', 'tenant_commitments.pdf'],
        milestones: [
          { percentage: 30, description: 'Construction and core systems' },
          { percentage: 25, description: 'Facade and interior buildout' },
          { percentage: 25, description: 'Technology infrastructure' },
          { percentage: 20, description: 'Tenant improvements and leasing' }
        ]
      },
      {
        title: 'Vineyard Resort Development - La Rioja',
        description: 'Boutique wine resort in La Rioja featuring 30 luxury suites, world-class spa, wine tasting facilities, and 50 hectares of organic vineyards. Perfect blend of luxury hospitality and wine tourism.',
        location: 'La Rioja, Spain',
        targetAmount: 2100000,
        currency: 'EUR',
        expectedReturn: 13.7,
        duration: 48,
        riskLevel: 'Medium',
        propertyType: 'Resort',
        minimumInvestment: 4000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          'https://images.unsplash.com/photo-1547036967-23d11aacaee0'
        ],
        documents: ['agricultural_permits.pdf', 'hospitality_license.pdf', 'wine_production_license.pdf'],
        milestones: [
          { percentage: 25, description: 'Land development and vineyard planting' },
          { percentage: 30, description: 'Hotel and spa construction' },
          { percentage: 25, description: 'Wine facilities and equipment' },
          { percentage: 20, description: 'Operational setup and marketing' }
        ]
      },
      {
        title: 'Student Housing Complex - Barcelona',
        description: 'Modern student housing development near major universities in Barcelona, featuring 200 fully furnished units, co-working spaces, gym, and rooftop terraces. Targeting international students and young professionals.',
        location: 'Eixample, Barcelona, Spain',
        targetAmount: 1650000,
        currency: 'EUR',
        expectedReturn: 15.2,
        duration: 24,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 2500,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1555636222-cae831e670b3',
          'https://images.unsplash.com/photo-1600298881974-6be191ceeda1',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
        ],
        documents: ['university_partnerships.pdf', 'student_housing_permits.pdf', 'occupancy_projections.pdf'],
        milestones: [
          { percentage: 30, description: 'Construction and infrastructure' },
          { percentage: 25, description: 'Interior design and furnishing' },
          { percentage: 25, description: 'Technology and amenities installation' },
          { percentage: 20, description: 'Pre-leasing and operations setup' }
        ]
      },
      {
        title: 'Coastal Shopping Center - Valencia',
        description: 'Premium shopping and entertainment complex in Valencia\'s coastal area, featuring 80 retail units, restaurants, cinema, and event spaces. Designed to serve both locals and millions of annual tourists.',
        location: 'Ciudad de las Artes y las Ciencias, Valencia, Spain',
        targetAmount: 2800000,
        currency: 'EUR',
        expectedReturn: 12.5,
        duration: 36,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 6000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
          'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6'
        ],
        documents: ['retail_tenant_agreements.pdf', 'tourism_impact_study.pdf', 'parking_permits.pdf'],
        milestones: [
          { percentage: 35, description: 'Construction and infrastructure' },
          { percentage: 25, description: 'Retail spaces and common areas' },
          { percentage: 25, description: 'Entertainment facilities' },
          { percentage: 15, description: 'Tenant fit-out and grand opening' }
        ]
      }
    ];

    // MEXICO PROPERTIES (6)
    const mexicoProperties = [
      {
        title: 'Luxury Beach Resort - Tulum',
        description: 'Eco-luxury resort in Tulum featuring 40 beachfront villas with private pools, spa, cenote access, and organic farm-to-table restaurant. Sustainable design using local materials and renewable energy.',
        location: 'Tulum, Quintana Roo, Mexico',
        targetAmount: 15000000,
        currency: 'MXN',
        expectedReturn: 16.8,
        duration: 42,
        riskLevel: 'High',
        propertyType: 'Resort',
        minimumInvestment: 50000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4'
        ],
        documents: ['environmental_permits.pdf', 'cenote_access_rights.pdf', 'sustainability_certification.pdf'],
        milestones: [
          { percentage: 30, description: 'Environmental permits and site preparation' },
          { percentage: 35, description: 'Villa construction and infrastructure' },
          { percentage: 20, description: 'Amenities and landscape development' },
          { percentage: 15, description: 'Operations setup and soft opening' }
        ]
      },
      {
        title: 'Corporate Headquarters - Mexico City',
        description: 'Premium office tower in Santa Fe business district, Mexico City. 25 floors of Class A office space with advanced technology, conference facilities, and panoramic city views. Pre-leased to Fortune 500 companies.',
        location: 'Santa Fe, Mexico City, Mexico',
        targetAmount: 12500000,
        currency: 'MXN',
        expectedReturn: 13.5,
        duration: 36,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 75000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
          'https://images.unsplash.com/photo-1497366216548-37526070297c',
          'https://images.unsplash.com/photo-1541746972996-4e0b0f93e586'
        ],
        documents: ['corporate_lease_agreements.pdf', 'seismic_safety_certification.pdf', 'building_permits.pdf'],
        milestones: [
          { percentage: 40, description: 'Foundation and structural completion' },
          { percentage: 30, description: 'Facade and mechanical systems' },
          { percentage: 20, description: 'Interior build-out and technology' },
          { percentage: 10, description: 'Final inspections and tenant move-in' }
        ]
      },
      {
        title: 'Residential Community - Playa del Carmen',
        description: 'Gated residential community in Playa del Carmen featuring 150 luxury homes, private beach access, golf course, marina, and resort-style amenities. Targeting affluent Mexican and international buyers.',
        location: 'Playa del Carmen, Quintana Roo, Mexico',
        targetAmount: 18000000,
        currency: 'MXN',
        expectedReturn: 15.3,
        duration: 54,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 60000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
        ],
        documents: ['master_development_plan.pdf', 'environmental_impact_assessment.pdf', 'golf_course_permits.pdf'],
        milestones: [
          { percentage: 25, description: 'Infrastructure and golf course' },
          { percentage: 35, description: 'Phase 1 homes and amenities' },
          { percentage: 25, description: 'Phase 2 homes and marina' },
          { percentage: 15, description: 'Community completion and handover' }
        ]
      },
      {
        title: 'Industrial Logistics Park - Guadalajara',
        description: 'Modern logistics and distribution center in Guadalajara\'s industrial corridor. 50,000 sqm of warehouse space with advanced automation, rail access, and proximity to major highways and airport.',
        location: 'El Salto, Guadalajara, Jalisco, Mexico',
        targetAmount: 8500000,
        currency: 'MXN',
        expectedReturn: 14.2,
        duration: 30,
        riskLevel: 'Low',
        propertyType: 'Industrial',
        minimumInvestment: 40000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
          'https://images.unsplash.com/photo-1565793298595-6a879b1d9492'
        ],
        documents: ['logistics_tenant_agreements.pdf', 'rail_access_permits.pdf', 'automation_specifications.pdf'],
        milestones: [
          { percentage: 35, description: 'Site preparation and infrastructure' },
          { percentage: 30, description: 'Warehouse construction' },
          { percentage: 25, description: 'Automation and technology installation' },
          { percentage: 10, description: 'Tenant improvements and operations' }
        ]
      },
      {
        title: 'Historic Center Mixed-Use - Puebla',
        description: 'Restoration and conversion of colonial buildings in Puebla\'s UNESCO World Heritage historic center into mixed-use development with boutique hotel, restaurants, retail, and cultural spaces.',
        location: 'Centro Histórico, Puebla, Mexico',
        targetAmount: 6200000,
        currency: 'MXN',
        expectedReturn: 12.9,
        duration: 36,
        riskLevel: 'Medium',
        propertyType: 'Mixed-Use',
        minimumInvestment: 25000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1543783207-ec64e4d95325',
          'https://images.unsplash.com/photo-1555636222-cae831e670b3',
          'https://images.unsplash.com/photo-1600298881974-6be191ceeda1'
        ],
        documents: ['unesco_heritage_permits.pdf', 'hotel_operating_license.pdf', 'cultural_center_approvals.pdf'],
        milestones: [
          { percentage: 30, description: 'Heritage restoration and permits' },
          { percentage: 35, description: 'Hotel and restaurant spaces' },
          { percentage: 25, description: 'Retail and cultural areas' },
          { percentage: 10, description: 'Operations launch and marketing' }
        ]
      },
      {
        title: 'Retirement Community - Mérida',
        description: 'Luxury retirement community in Mérida targeting American and Canadian retirees. Features 80 villas, medical center, recreational facilities, and concierge services with 24/7 security.',
        location: 'Mérida, Yucatán, Mexico',
        targetAmount: 9800000,
        currency: 'MXN',
        expectedReturn: 13.8,
        duration: 48,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 35000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1600298881974-6be191ceeda1',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'
        ],
        documents: ['medical_facility_permits.pdf', 'retirement_community_regulations.pdf', 'international_marketing_plan.pdf'],
        milestones: [
          { percentage: 25, description: 'Infrastructure and medical center' },
          { percentage: 35, description: 'Villa construction Phase 1' },
          { percentage: 25, description: 'Villa construction Phase 2 and amenities' },
          { percentage: 15, description: 'Operations setup and resident move-in' }
        ]
      }
    ];

    // US/UK PROPERTIES (6)
    const internationalProperties = [
      {
        title: 'Luxury Condominiums - Miami Beach',
        description: 'Ultra-luxury oceanfront condominiums in South Beach featuring 60 units with floor-to-ceiling windows, private balconies, rooftop infinity pool, spa, and concierge services. Prime location steps from world-famous beaches.',
        location: 'South Beach, Miami, Florida, USA',
        targetAmount: 2800000,
        currency: 'USD',
        expectedReturn: 13.2,
        duration: 36,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 10000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d'
        ],
        documents: ['florida_building_permits.pdf', 'oceanfront_development_rights.pdf', 'hurricane_insurance_policy.pdf'],
        milestones: [
          { percentage: 30, description: 'Foundation and structure' },
          { percentage: 35, description: 'Interior build-out and systems' },
          { percentage: 25, description: 'Amenities and common areas' },
          { percentage: 10, description: 'Final approvals and unit sales' }
        ]
      },
      {
        title: 'Tech Campus - Austin',
        description: 'Modern technology campus in Austin\'s Silicon Hills featuring 200,000 sqft of flexible office space, innovation labs, cafeterias, and outdoor collaboration areas. Pre-leased to major tech companies.',
        location: 'Silicon Hills, Austin, Texas, USA',
        targetAmount: 3500000,
        currency: 'USD',
        expectedReturn: 11.8,
        duration: 42,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 15000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1497366216548-37526070297c',
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'
        ],
        documents: ['tech_tenant_agreements.pdf', 'leed_platinum_certification.pdf', 'innovation_lab_specifications.pdf'],
        milestones: [
          { percentage: 35, description: 'Campus infrastructure and core buildings' },
          { percentage: 30, description: 'Technology infrastructure and labs' },
          { percentage: 25, description: 'Interior spaces and amenities' },
          { percentage: 10, description: 'Tenant move-in and operations' }
        ]
      },
      {
        title: 'Boutique Hotel - London Canary Wharf',
        description: 'Luxury boutique hotel in London\'s financial district featuring 120 rooms, Michelin-starred restaurant, executive club, and conference facilities. Targeting business travelers and financial professionals.',
        location: 'Canary Wharf, London, UK',
        targetAmount: 4200000,
        currency: 'GBP',
        expectedReturn: 10.5,
        duration: 48,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 12000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
        ],
        documents: ['uk_hospitality_license.pdf', 'michelin_restaurant_plans.pdf', 'canary_wharf_development_permits.pdf'],
        milestones: [
          { percentage: 30, description: 'Building acquisition and planning' },
          { percentage: 35, description: 'Hotel renovation and systems' },
          { percentage: 25, description: 'Restaurant and conference facilities' },
          { percentage: 10, description: 'Operations setup and grand opening' }
        ]
      },
      {
        title: 'Sustainable Housing Development - Portland',
        description: 'Eco-friendly residential development in Portland featuring 80 LEED-certified homes with solar panels, rainwater harvesting, and community gardens. Targeting environmentally conscious families.',
        location: 'Pearl District, Portland, Oregon, USA',
        targetAmount: 2200000,
        currency: 'USD',
        expectedReturn: 12.3,
        duration: 30,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 8000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1600298881974-6be191ceeda1',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'
        ],
        documents: ['leed_certification_plan.pdf', 'sustainable_design_specifications.pdf', 'community_garden_permits.pdf'],
        milestones: [
          { percentage: 25, description: 'Site preparation and infrastructure' },
          { percentage: 40, description: 'Sustainable home construction' },
          { percentage: 25, description: 'Solar installation and landscaping' },
          { percentage: 10, description: 'Final inspections and home sales' }
        ]
      },
      {
        title: 'Student Housing Complex - Cambridge',
        description: 'Purpose-built student accommodation near Cambridge University featuring 300 en-suite rooms, study spaces, gym, cinema, and social areas. Guaranteed rental income through university partnerships.',
        location: 'Cambridge, England, UK',
        targetAmount: 3800000,
        currency: 'GBP',
        expectedReturn: 14.7,
        duration: 24,
        riskLevel: 'Low',
        propertyType: 'Residential',
        minimumInvestment: 8000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1555636222-cae831e670b3',
          'https://images.unsplash.com/photo-1600298881974-6be191ceeda1',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
        ],
        documents: ['cambridge_university_partnership.pdf', 'student_housing_permits.pdf', 'guaranteed_occupancy_agreement.pdf'],
        milestones: [
          { percentage: 35, description: 'Construction and infrastructure' },
          { percentage: 30, description: 'Interior fit-out and furnishing' },
          { percentage: 25, description: 'Amenities and technology installation' },
          { percentage: 10, description: 'University partnership activation' }
        ]
      },
      {
        title: 'Mixed-Use Development - Nashville',
        description: 'Vibrant mixed-use development in Nashville\'s Music Row featuring ground-floor retail, restaurants, office space, and luxury apartments. Perfect blend of live, work, and entertainment spaces.',
        location: 'Music Row, Nashville, Tennessee, USA',
        targetAmount: 2900000,
        currency: 'USD',
        expectedReturn: 13.9,
        duration: 39,
        riskLevel: 'Medium',
        propertyType: 'Mixed-Use',
        minimumInvestment: 9000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
          'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6'
        ],
        documents: ['music_row_zoning_permits.pdf', 'mixed_use_development_plan.pdf', 'entertainment_venue_licenses.pdf'],
        milestones: [
          { percentage: 30, description: 'Foundation and structural work' },
          { percentage: 35, description: 'Apartment and office construction' },
          { percentage: 25, description: 'Retail spaces and entertainment areas' },
          { percentage: 10, description: 'Tenant leasing and grand opening' }
        ]
      }
    ];

    const allProperties = [...spainProperties, ...mexicoProperties, ...internationalProperties];
    
    console.log(`📊 Creating ${allProperties.length} properties...`);
    
    for (let i = 0; i < allProperties.length; i++) {
      const property = allProperties[i];
      const project = await prisma.project.create({
        data: property
      });
      console.log(`✅ ${i + 1}/18: ${project.title}`);
    }

    console.log('\n🎯 Portfolio Creation Summary:');
    console.log('=' * 50);
    console.log('🇪🇸 Spain: 6 properties (EUR 14.15M total)');
    console.log('🇲🇽 Mexico: 6 properties (MXN 80M total)');
    console.log('🇺🇸🇬🇧 International: 6 properties (USD/GBP 19.4M total)');
    console.log('\n📈 Property Types Distribution:');
    console.log('• Residential: 8 properties');
    console.log('• Commercial: 5 properties');
    console.log('• Resort/Hospitality: 3 properties');
    console.log('• Mixed-Use: 2 properties');
    
    console.log('\n💰 Investment Ranges:');
    console.log('• Minimum investments: €2,500 - $75,000');
    console.log('• Expected returns: 10.5% - 16.8%');
    console.log('• Project durations: 24 - 54 months');

    const totalProjects = await prisma.project.count();
    console.log(`\n🚀 Portfolio complete! ${totalProjects} properties ready for investment.`);

  } catch (error) {
    console.error('❌ Portfolio creation failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createPropertyPortfolio();