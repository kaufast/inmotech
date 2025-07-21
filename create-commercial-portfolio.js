const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_m1zGSYrLNx5w@ep-orange-cake-ad7qt1rl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function createCommercialPortfolio() {
  console.log('🏢 Creating InmoTech Commercial Property Portfolio - 18 Properties\n');
  
  try {
    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@inmote.ch' }
    });

    if (!admin) {
      console.error('❌ Admin user not found. Please run create-property-portfolio.js first.');
      return;
    }

    // SPAIN COMMERCIAL PROPERTIES (6)
    const spainCommercial = [
      {
        title: 'Barcelona Tech Hub - 22@',
        description: 'State-of-the-art technology office complex in Barcelona\'s innovation district. 25,000 sqm of smart office space with AI-powered building management, green terraces, and direct metro access. Targeting tech giants and startups.',
        location: '22@ District, Barcelona, Spain',
        targetAmount: 4200000,
        currency: 'EUR',
        expectedReturn: 12.4,
        duration: 36,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 8000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1497366216548-37526070297c',
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
          'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a'
        ],
        documents: ['tech_district_permits.pdf', 'smart_building_certification.pdf', 'anchor_tenant_loi.pdf'],
        milestones: [
          { percentage: 35, description: 'Core construction and smart infrastructure' },
          { percentage: 30, description: 'Interior fit-out and technology systems' },
          { percentage: 25, description: 'Green spaces and amenities' },
          { percentage: 10, description: 'Tenant customization and occupancy' }
        ]
      },
      {
        title: 'Madrid Logistics Center - A2 Corridor',
        description: 'Premium logistics facility in Madrid\'s prime distribution corridor. 40,000 sqm warehouse with automated systems, cross-docking capabilities, and solar roof. Strategic location serving Madrid and central Spain.',
        location: 'San Fernando de Henares, Madrid, Spain',
        targetAmount: 3500000,
        currency: 'EUR',
        expectedReturn: 11.8,
        duration: 30,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 7000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
          'https://images.unsplash.com/photo-1565793298595-6a879b1d9492'
        ],
        documents: ['logistics_zone_permits.pdf', 'amazon_pre_lease_agreement.pdf', 'solar_installation_plan.pdf'],
        milestones: [
          { percentage: 40, description: 'Site preparation and structure' },
          { percentage: 30, description: 'Automated systems installation' },
          { percentage: 20, description: 'Solar roof and sustainability features' },
          { percentage: 10, description: 'Final testing and operations' }
        ]
      },
      {
        title: 'Malaga International Business Center',
        description: 'Modern business complex near Malaga airport featuring Grade A offices, conference center, and business hotel. Perfect for international companies establishing Mediterranean headquarters.',
        location: 'Airport Business District, Malaga, Spain',
        targetAmount: 3800000,
        currency: 'EUR',
        expectedReturn: 13.2,
        duration: 42,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 6500,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
          'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a',
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72'
        ],
        documents: ['airport_district_development.pdf', 'conference_center_plans.pdf', 'business_hotel_operator.pdf'],
        milestones: [
          { percentage: 30, description: 'Foundation and main structure' },
          { percentage: 35, description: 'Office towers and hotel construction' },
          { percentage: 25, description: 'Conference center and common areas' },
          { percentage: 10, description: 'International marketing and leasing' }
        ]
      },
      {
        title: 'Bilbao Waterfront Retail Complex',
        description: 'Premium retail and entertainment destination on Bilbao\'s renovated waterfront. 35,000 sqm featuring flagship stores, restaurants with river views, cinema complex, and urban beach club.',
        location: 'Abandoibarra Waterfront, Bilbao, Spain',
        targetAmount: 2900000,
        currency: 'EUR',
        expectedReturn: 12.7,
        duration: 36,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 5500,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
          'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6'
        ],
        documents: ['waterfront_development_rights.pdf', 'retail_tenant_commitments.pdf', 'entertainment_licenses.pdf'],
        milestones: [
          { percentage: 35, description: 'Waterfront infrastructure and structure' },
          { percentage: 30, description: 'Retail spaces and common areas' },
          { percentage: 25, description: 'Entertainment facilities and beach club' },
          { percentage: 10, description: 'Grand opening and marketing' }
        ]
      },
      {
        title: 'Zaragoza Data Center Campus',
        description: 'Tier 4 data center facility in Zaragoza\'s technology park. 15,000 sqm with renewable energy, advanced cooling, and fiber connectivity. Serving cloud providers and enterprise clients.',
        location: 'PLAZA Technology Park, Zaragoza, Spain',
        targetAmount: 5200000,
        currency: 'EUR',
        expectedReturn: 14.5,
        duration: 48,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 10000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
          'https://images.unsplash.com/photo-1484807352052-23338990c6c6',
          'https://images.unsplash.com/photo-1565793298595-6a879b1d9492'
        ],
        documents: ['tier4_certification_plan.pdf', 'renewable_energy_contracts.pdf', 'hyperscale_tenant_loi.pdf'],
        milestones: [
          { percentage: 30, description: 'Critical infrastructure and power systems' },
          { percentage: 35, description: 'Data halls and cooling systems' },
          { percentage: 25, description: 'Security and connectivity infrastructure' },
          { percentage: 10, description: 'Testing and client onboarding' }
        ]
      },
      {
        title: 'Palma de Mallorca Marina Hotel',
        description: 'Luxury marina hotel in Palma featuring 180 rooms, yacht club, conference facilities, and rooftop spa. Prime location overlooking super-yacht marina with direct airport access.',
        location: 'Port de Palma, Mallorca, Spain',
        targetAmount: 3600000,
        currency: 'EUR',
        expectedReturn: 13.8,
        duration: 42,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 7500,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
        ],
        documents: ['marina_development_rights.pdf', 'luxury_hotel_brand_agreement.pdf', 'yacht_club_permits.pdf'],
        milestones: [
          { percentage: 30, description: 'Marina infrastructure and foundation' },
          { percentage: 35, description: 'Hotel construction and yacht club' },
          { percentage: 25, description: 'Luxury amenities and spa' },
          { percentage: 10, description: 'Soft opening and marketing' }
        ]
      }
    ];

    // MEXICO COMMERCIAL PROPERTIES (6)
    const mexicoCommercial = [
      {
        title: 'Mexico City Financial Tower',
        description: 'Premium office tower in Polanco financial district. 35 floors of Class A+ office space with helipad, trading floors, and executive clubs. Pre-leased to major banks and financial institutions.',
        location: 'Polanco, Mexico City, Mexico',
        targetAmount: 22000000,
        currency: 'MXN',
        expectedReturn: 12.6,
        duration: 48,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 100000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
          'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a',
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72'
        ],
        documents: ['bank_pre_lease_agreements.pdf', 'helipad_permits.pdf', 'financial_district_zoning.pdf'],
        milestones: [
          { percentage: 35, description: 'Foundation and core structure' },
          { percentage: 30, description: 'Facade and building systems' },
          { percentage: 25, description: 'Trading floors and executive areas' },
          { percentage: 10, description: 'Final certifications and tenant fit-out' }
        ]
      },
      {
        title: 'Cancun Convention & Resort Center',
        description: 'World-class convention center with integrated resort hotel in Cancun\'s hotel zone. 50,000 sqm of exhibition space, 500-room hotel, and beachfront amenities targeting international events.',
        location: 'Hotel Zone, Cancun, Quintana Roo, Mexico',
        targetAmount: 28000000,
        currency: 'MXN',
        expectedReturn: 15.4,
        duration: 54,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 120000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
        ],
        documents: ['convention_center_feasibility.pdf', 'hotel_brand_agreement.pdf', 'event_booking_pipeline.pdf'],
        milestones: [
          { percentage: 30, description: 'Site preparation and foundations' },
          { percentage: 35, description: 'Convention halls and hotel towers' },
          { percentage: 25, description: 'Beach clubs and resort amenities' },
          { percentage: 10, description: 'International marketing launch' }
        ]
      },
      {
        title: 'Monterrey Tech Manufacturing Hub',
        description: 'Advanced manufacturing facility in Monterrey for automotive and aerospace industries. 60,000 sqm with clean rooms, R&D labs, and Industry 4.0 capabilities.',
        location: 'PIIT Research Park, Monterrey, Nuevo León, Mexico',
        targetAmount: 18500000,
        currency: 'MXN',
        expectedReturn: 13.9,
        duration: 36,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 80000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158'
        ],
        documents: ['aerospace_certifications.pdf', 'tesla_supplier_agreement.pdf', 'research_lab_specs.pdf'],
        milestones: [
          { percentage: 35, description: 'Clean room construction' },
          { percentage: 30, description: 'Manufacturing equipment installation' },
          { percentage: 25, description: 'R&D labs and testing facilities' },
          { percentage: 10, description: 'Certification and production start' }
        ]
      },
      {
        title: 'Guadalajara Medical Plaza',
        description: 'Specialized medical office complex with surgery center, diagnostic imaging, and specialty clinics. 25,000 sqm serving medical tourism and local healthcare needs.',
        location: 'Puerta de Hierro, Guadalajara, Jalisco, Mexico',
        targetAmount: 14200000,
        currency: 'MXN',
        expectedReturn: 14.1,
        duration: 42,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 60000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
          'https://images.unsplash.com/photo-1538108149393-fbbd81895907',
          'https://images.unsplash.com/photo-1516549655169-df83a0774514'
        ],
        documents: ['medical_facility_licenses.pdf', 'hospital_partnership_mou.pdf', 'medical_tourism_analysis.pdf'],
        milestones: [
          { percentage: 30, description: 'Medical-grade construction' },
          { percentage: 35, description: 'Surgery center and imaging' },
          { percentage: 25, description: 'Specialty clinics fit-out' },
          { percentage: 10, description: 'Equipment installation and licensing' }
        ]
      },
      {
        title: 'Oaxaca Cultural Mall & Hotel',
        description: 'Mixed commercial development celebrating Oaxacan culture with artisan market, cultural center, boutique hotel, and mezcal tasting experiences. Prime historic center location.',
        location: 'Centro Histórico, Oaxaca, Mexico',
        targetAmount: 9800000,
        currency: 'MXN',
        expectedReturn: 13.3,
        duration: 36,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 40000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
          'https://images.unsplash.com/photo-1543783207-ec64e4d95325'
        ],
        documents: ['unesco_heritage_compliance.pdf', 'artisan_vendor_agreements.pdf', 'cultural_center_program.pdf'],
        milestones: [
          { percentage: 35, description: 'Heritage-compliant construction' },
          { percentage: 30, description: 'Artisan market and retail spaces' },
          { percentage: 25, description: 'Hotel and cultural center' },
          { percentage: 10, description: 'Vendor onboarding and opening' }
        ]
      },
      {
        title: 'Tijuana Cross-Border Logistics Center',
        description: 'Strategic logistics facility at US-Mexico border. 45,000 sqm with customs clearance, cold storage, and cross-docking for NAFTA trade. Serving maquiladora and e-commerce sectors.',
        location: 'Mesa de Otay, Tijuana, Baja California, Mexico',
        targetAmount: 16500000,
        currency: 'MXN',
        expectedReturn: 15.7,
        duration: 30,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 70000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
          'https://images.unsplash.com/photo-1565793298595-6a879b1d9492'
        ],
        documents: ['customs_facility_license.pdf', 'cross_border_permits.pdf', 'amazon_fulfillment_loi.pdf'],
        milestones: [
          { percentage: 40, description: 'Customs-compliant infrastructure' },
          { percentage: 30, description: 'Cold storage and warehousing' },
          { percentage: 20, description: 'Technology and security systems' },
          { percentage: 10, description: 'Customs certification and operations' }
        ]
      }
    ];

    // US/UK COMMERCIAL PROPERTIES (6)
    const internationalCommercial = [
      {
        title: 'Manhattan Mixed-Use Tower - Hudson Yards',
        description: 'Iconic 60-story mixed-use tower in Hudson Yards featuring luxury retail, Class A offices, and observation deck. Prime location in NYC\'s newest neighborhood with direct High Line access.',
        location: 'Hudson Yards, Manhattan, New York, USA',
        targetAmount: 8500000,
        currency: 'USD',
        expectedReturn: 11.2,
        duration: 60,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 25000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
          'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a',
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72'
        ],
        documents: ['hudson_yards_masterplan.pdf', 'flagship_retail_loi.pdf', 'observation_deck_feasibility.pdf'],
        milestones: [
          { percentage: 30, description: 'Foundation and core structure' },
          { percentage: 35, description: 'Tower construction and facade' },
          { percentage: 25, description: 'Interior fit-out and observation deck' },
          { percentage: 10, description: 'Retail leasing and grand opening' }
        ]
      },
      {
        title: 'Silicon Valley Life Sciences Campus',
        description: 'Cutting-edge life sciences campus in South San Francisco. 300,000 sqft of lab space, clean rooms, and office facilities designed for biotech and pharmaceutical companies.',
        location: 'South San Francisco, California, USA',
        targetAmount: 6200000,
        currency: 'USD',
        expectedReturn: 12.8,
        duration: 42,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 20000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
          'https://images.unsplash.com/photo-1497366216548-37526070297c',
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2'
        ],
        documents: ['biotech_lab_specifications.pdf', 'pharmaceutical_tenant_loi.pdf', 'clean_room_certification.pdf'],
        milestones: [
          { percentage: 35, description: 'Specialized lab construction' },
          { percentage: 30, description: 'Clean rooms and research facilities' },
          { percentage: 25, description: 'Office and collaboration spaces' },
          { percentage: 10, description: 'Equipment installation and validation' }
        ]
      },
      {
        title: 'London City Airport Hotel & Conference',
        description: 'Business hotel and conference center directly connected to London City Airport. 250 rooms, 10,000 sqm conference space, and executive lounges serving financial district travelers.',
        location: 'Royal Docks, London City Airport, UK',
        targetAmount: 5800000,
        currency: 'GBP',
        expectedReturn: 11.9,
        duration: 48,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 15000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
        ],
        documents: ['airport_connection_agreement.pdf', 'conference_booking_pipeline.pdf', 'business_hotel_brand.pdf'],
        milestones: [
          { percentage: 30, description: 'Airport connection and structure' },
          { percentage: 35, description: 'Hotel rooms and conference halls' },
          { percentage: 25, description: 'Business facilities and lounges' },
          { percentage: 10, description: 'Operations setup and marketing' }
        ]
      },
      {
        title: 'Las Vegas Entertainment Complex',
        description: 'Next-generation entertainment complex off the Strip featuring e-sports arena, virtual reality experiences, concert venue, and themed restaurants. Targeting millennial and Gen-Z visitors.',
        location: 'Las Vegas Boulevard, Nevada, USA',
        targetAmount: 4800000,
        currency: 'USD',
        expectedReturn: 14.6,
        duration: 36,
        riskLevel: 'High',
        propertyType: 'Commercial',
        minimumInvestment: 18000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8'
        ],
        documents: ['gaming_licenses.pdf', 'esports_league_partnership.pdf', 'entertainment_permits.pdf'],
        milestones: [
          { percentage: 35, description: 'Core structure and technology infrastructure' },
          { percentage: 30, description: 'E-sports arena and VR facilities' },
          { percentage: 25, description: 'Concert venue and restaurants' },
          { percentage: 10, description: 'Technology testing and launch events' }
        ]
      },
      {
        title: 'Edinburgh Science Quarter',
        description: 'Innovation campus in Edinburgh featuring lab space, tech offices, and startup incubator. Part of city\'s science quarter development serving university spin-offs and tech companies.',
        location: 'BioQuarter, Edinburgh, Scotland, UK',
        targetAmount: 4500000,
        currency: 'GBP',
        expectedReturn: 12.3,
        duration: 42,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 12000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1497366216548-37526070297c',
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158'
        ],
        documents: ['university_partnership.pdf', 'science_quarter_masterplan.pdf', 'startup_incubator_program.pdf'],
        milestones: [
          { percentage: 30, description: 'Lab and research facilities' },
          { percentage: 35, description: 'Office and collaboration spaces' },
          { percentage: 25, description: 'Incubator and shared facilities' },
          { percentage: 10, description: 'University integration and launch' }
        ]
      },
      {
        title: 'Seattle Waterfront Marketplace',
        description: 'Premium retail and dining destination on Seattle\'s renovated waterfront. 40,000 sqm featuring Pike Place Market expansion, seafood restaurants, and observation wheel complex.',
        location: 'Elliott Bay Waterfront, Seattle, Washington, USA',
        targetAmount: 3900000,
        currency: 'USD',
        expectedReturn: 13.5,
        duration: 36,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 14000,
        createdBy: admin.id,
        images: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
          'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6'
        ],
        documents: ['waterfront_development_rights.pdf', 'pike_place_expansion.pdf', 'seafood_vendor_agreements.pdf'],
        milestones: [
          { percentage: 35, description: 'Waterfront infrastructure' },
          { percentage: 30, description: 'Market expansion and retail' },
          { percentage: 25, description: 'Restaurants and observation areas' },
          { percentage: 10, description: 'Vendor onboarding and opening' }
        ]
      }
    ];

    const allCommercialProperties = [...spainCommercial, ...mexicoCommercial, ...internationalCommercial];
    
    console.log(`📊 Creating ${allCommercialProperties.length} commercial properties...`);
    
    for (let i = 0; i < allCommercialProperties.length; i++) {
      const property = allCommercialProperties[i];
      const project = await prisma.project.create({
        data: property
      });
      console.log(`✅ ${i + 1}/18: ${project.title}`);
    }

    console.log('\n🏢 Commercial Portfolio Summary:');
    console.log('=' * 50);
    console.log('🇪🇸 Spain: 6 commercial properties');
    console.log('• Tech Hub, Logistics Center, Business Center');
    console.log('• Retail Complex, Data Center, Marina Hotel');
    console.log('Total: €24.4M');
    
    console.log('\n🇲🇽 Mexico: 6 commercial properties');
    console.log('• Financial Tower, Convention Center, Manufacturing Hub');
    console.log('• Medical Plaza, Cultural Mall, Border Logistics');
    console.log('Total: MXN 119M');
    
    console.log('\n🇺🇸🇬🇧 International: 6 commercial properties');
    console.log('• NYC Tower, Life Sciences Campus, Airport Hotel');
    console.log('• Entertainment Complex, Science Quarter, Waterfront Market');
    console.log('Total: $27.4M USD / £10.3M GBP');

    console.log('\n📈 Commercial Property Features:');
    console.log('• Office Spaces: 6 properties');
    console.log('• Retail/Entertainment: 6 properties');
    console.log('• Industrial/Logistics: 3 properties');
    console.log('• Hotels/Hospitality: 3 properties');
    
    console.log('\n💰 Investment Details:');
    console.log('• Minimum investments: €5,500 - $120,000');
    console.log('• Expected returns: 11.2% - 15.7%');
    console.log('• Project durations: 30 - 60 months');

    const totalProjects = await prisma.project.count();
    console.log(`\n🚀 Commercial portfolio complete! Total properties: ${totalProjects}`);

  } catch (error) {
    console.error('❌ Commercial portfolio creation failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createCommercialPortfolio();