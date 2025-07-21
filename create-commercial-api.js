const fetch = require('node-fetch');

async function createCommercialPortfolio() {
  console.log('🏢 Creating Commercial Properties via API...\n');

  // First, get auth token
  const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@inmote.ch',
      password: 'AdminPass123!'
    })
  });

  const { token } = await loginResponse.json();
  
  if (!token) {
    console.error('❌ Failed to authenticate as admin');
    return;
  }

  // SPAIN COMMERCIAL PROPERTIES (6)
  const spainCommercial = [
    {
      title: 'Barcelona Tech Hub - 22@',
      description: 'State-of-the-art technology office complex in Barcelona\'s innovation district. 25,000 sqm of smart office space with AI-powered building management, green terraces, and direct metro access.',
      location: '22@ District, Barcelona, Spain',
      targetAmount: 4200000,
      currency: 'EUR',
      expectedReturn: 12.4,
      duration: 36,
      riskLevel: 'Low',
      propertyType: 'Commercial',
      minimumInvestment: 8000,
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
        'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a'
      ]
    },
    {
      title: 'Madrid Logistics Center - A2 Corridor',
      description: 'Premium logistics facility in Madrid\'s prime distribution corridor. 40,000 sqm warehouse with automated systems, cross-docking capabilities, and solar roof.',
      location: 'San Fernando de Henares, Madrid, Spain',
      targetAmount: 3500000,
      currency: 'EUR',
      expectedReturn: 11.8,
      duration: 30,
      riskLevel: 'Low',
      propertyType: 'Commercial',
      minimumInvestment: 7000,
      images: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        'https://images.unsplash.com/photo-1565793298595-6a879b1d9492'
      ]
    },
    {
      title: 'Malaga International Business Center',
      description: 'Modern business complex near Malaga airport featuring Grade A offices, conference center, and business hotel.',
      location: 'Airport Business District, Malaga, Spain',
      targetAmount: 3800000,
      currency: 'EUR',
      expectedReturn: 13.2,
      duration: 42,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 6500,
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72'
      ]
    },
    {
      title: 'Bilbao Waterfront Retail Complex',
      description: 'Premium retail and entertainment destination on Bilbao\'s renovated waterfront. 35,000 sqm featuring flagship stores, restaurants, and cinema.',
      location: 'Abandoibarra Waterfront, Bilbao, Spain',
      targetAmount: 2900000,
      currency: 'EUR',
      expectedReturn: 12.7,
      duration: 36,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 5500,
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
        'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6'
      ]
    },
    {
      title: 'Zaragoza Data Center Campus',
      description: 'Tier 4 data center facility in Zaragoza\'s technology park. 15,000 sqm with renewable energy and advanced cooling.',
      location: 'PLAZA Technology Park, Zaragoza, Spain',
      targetAmount: 5200000,
      currency: 'EUR',
      expectedReturn: 14.5,
      duration: 48,
      riskLevel: 'Low',
      propertyType: 'Commercial',
      minimumInvestment: 10000,
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
        'https://images.unsplash.com/photo-1484807352052-23338990c6c6',
        'https://images.unsplash.com/photo-1565793298595-6a879b1d9492'
      ]
    },
    {
      title: 'Palma de Mallorca Marina Hotel',
      description: 'Luxury marina hotel in Palma featuring 180 rooms, yacht club, and rooftop spa overlooking super-yacht marina.',
      location: 'Port de Palma, Mallorca, Spain',
      targetAmount: 3600000,
      currency: 'EUR',
      expectedReturn: 13.8,
      duration: 42,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 7500,
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
      ]
    }
  ];

  // MEXICO COMMERCIAL PROPERTIES (6)
  const mexicoCommercial = [
    {
      title: 'Mexico City Financial Tower',
      description: 'Premium office tower in Polanco. 35 floors with helipad and trading floors, pre-leased to major banks.',
      location: 'Polanco, Mexico City, Mexico',
      targetAmount: 22000000,
      currency: 'MXN',
      expectedReturn: 12.6,
      duration: 48,
      riskLevel: 'Low',
      propertyType: 'Commercial',
      minimumInvestment: 100000,
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72'
      ]
    },
    {
      title: 'Cancun Convention & Resort Center',
      description: 'World-class convention center with 500-room hotel in Cancun\'s hotel zone. 50,000 sqm exhibition space.',
      location: 'Hotel Zone, Cancun, Quintana Roo, Mexico',
      targetAmount: 28000000,
      currency: 'MXN',
      expectedReturn: 15.4,
      duration: 54,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 120000,
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
      ]
    },
    {
      title: 'Monterrey Tech Manufacturing Hub',
      description: 'Advanced manufacturing facility for automotive and aerospace. 60,000 sqm with clean rooms and R&D labs.',
      location: 'PIIT Research Park, Monterrey, Nuevo León, Mexico',
      targetAmount: 18500000,
      currency: 'MXN',
      expectedReturn: 13.9,
      duration: 36,
      riskLevel: 'Low',
      propertyType: 'Commercial',
      minimumInvestment: 80000,
      images: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158'
      ]
    },
    {
      title: 'Guadalajara Medical Plaza',
      description: 'Specialized medical complex with surgery center and diagnostic imaging. 25,000 sqm serving medical tourism.',
      location: 'Puerta de Hierro, Guadalajara, Jalisco, Mexico',
      targetAmount: 14200000,
      currency: 'MXN',
      expectedReturn: 14.1,
      duration: 42,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 60000,
      images: [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
        'https://images.unsplash.com/photo-1538108149393-fbbd81895907',
        'https://images.unsplash.com/photo-1516549655169-df83a0774514'
      ]
    },
    {
      title: 'Oaxaca Cultural Mall & Hotel',
      description: 'Mixed development with artisan market, cultural center, and boutique hotel in historic center.',
      location: 'Centro Histórico, Oaxaca, Mexico',
      targetAmount: 9800000,
      currency: 'MXN',
      expectedReturn: 13.3,
      duration: 36,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 40000,
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
        'https://images.unsplash.com/photo-1543783207-ec64e4d95325'
      ]
    },
    {
      title: 'Tijuana Cross-Border Logistics',
      description: 'Strategic logistics facility at US-Mexico border. 45,000 sqm with customs clearance and cold storage.',
      location: 'Mesa de Otay, Tijuana, Baja California, Mexico',
      targetAmount: 16500000,
      currency: 'MXN',
      expectedReturn: 15.7,
      duration: 30,
      riskLevel: 'Low',
      propertyType: 'Commercial',
      minimumInvestment: 70000,
      images: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        'https://images.unsplash.com/photo-1565793298595-6a879b1d9492'
      ]
    }
  ];

  // US/UK COMMERCIAL PROPERTIES (6)
  const internationalCommercial = [
    {
      title: 'Manhattan Mixed-Use Tower',
      description: 'Iconic 60-story tower in Hudson Yards with luxury retail, offices, and observation deck.',
      location: 'Hudson Yards, Manhattan, New York, USA',
      targetAmount: 8500000,
      currency: 'USD',
      expectedReturn: 11.2,
      duration: 60,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 25000,
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72'
      ]
    },
    {
      title: 'Silicon Valley Life Sciences Campus',
      description: 'Cutting-edge biotech campus. 300,000 sqft of lab space and clean rooms for pharmaceutical companies.',
      location: 'South San Francisco, California, USA',
      targetAmount: 6200000,
      currency: 'USD',
      expectedReturn: 12.8,
      duration: 42,
      riskLevel: 'Low',
      propertyType: 'Commercial',
      minimumInvestment: 20000,
      images: [
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
        'https://images.unsplash.com/photo-1497366216548-37526070297c',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2'
      ]
    },
    {
      title: 'London City Airport Hotel',
      description: 'Business hotel connected to London City Airport. 250 rooms and 10,000 sqm conference space.',
      location: 'Royal Docks, London City Airport, UK',
      targetAmount: 5800000,
      currency: 'GBP',
      expectedReturn: 11.9,
      duration: 48,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 15000,
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
      ]
    },
    {
      title: 'Las Vegas Entertainment Complex',
      description: 'Next-gen entertainment with e-sports arena, VR experiences, and concert venue off the Strip.',
      location: 'Las Vegas Boulevard, Nevada, USA',
      targetAmount: 4800000,
      currency: 'USD',
      expectedReturn: 14.6,
      duration: 36,
      riskLevel: 'High',
      propertyType: 'Commercial',
      minimumInvestment: 18000,
      images: [
        'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8'
      ]
    },
    {
      title: 'Edinburgh Science Quarter',
      description: 'Innovation campus with lab space and startup incubator serving university spin-offs.',
      location: 'BioQuarter, Edinburgh, Scotland, UK',
      targetAmount: 4500000,
      currency: 'GBP',
      expectedReturn: 12.3,
      duration: 42,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 12000,
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158'
      ]
    },
    {
      title: 'Seattle Waterfront Marketplace',
      description: 'Premium retail destination on renovated waterfront. 40,000 sqm with Pike Place Market expansion.',
      location: 'Elliott Bay Waterfront, Seattle, Washington, USA',
      targetAmount: 3900000,
      currency: 'USD',
      expectedReturn: 13.5,
      duration: 36,
      riskLevel: 'Medium',
      propertyType: 'Commercial',
      minimumInvestment: 14000,
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
        'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6'
      ]
    }
  ];

  const allProperties = [...spainCommercial, ...mexicoCommercial, ...internationalCommercial];
  
  let created = 0;
  for (const property of allProperties) {
    try {
      const response = await fetch('http://localhost:3002/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...property,
          documents: ['investment_prospectus.pdf', 'financial_projections.pdf'],
          milestones: [
            { percentage: 35, description: 'Construction and infrastructure' },
            { percentage: 30, description: 'Interior build-out' },
            { percentage: 25, description: 'Systems and technology' },
            { percentage: 10, description: 'Final approvals and opening' }
          ]
        })
      });

      if (response.ok) {
        created++;
        console.log(`✅ ${created}/18: ${property.title}`);
      } else {
        const error = await response.json();
        console.log(`❌ Failed to create ${property.title}: ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${property.title}: ${error.message}`);
    }
  }

  console.log(`\n🚀 Created ${created} commercial properties successfully!`);
}

createCommercialPortfolio().catch(console.error);