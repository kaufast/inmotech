const fetch = require('node-fetch');

async function createMixedUsePortfolio() {
  console.log('🏙️ Creating Mixed-Use Properties via API...\n');

  // Get auth token
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

  // SPAIN MIXED-USE PROPERTIES (6)
  const spainMixedUse = [
    {
      title: 'Valencia Digital Quarter',
      description: 'Innovative mixed-use development combining tech offices, smart apartments, co-working spaces, urban farming, and digital art galleries. Features AI-powered building management and sustainable design.',
      location: 'Cabanyal-Canyamelar, Valencia, Spain',
      targetAmount: 5800000,
      currency: 'EUR',
      expectedReturn: 13.9,
      duration: 48,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 9000,
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8'
      ],
      documents: ['digital_quarter_masterplan.pdf', 'smart_city_integration.pdf', 'sustainability_certification.pdf'],
      milestones: [
        { percentage: 30, description: 'Infrastructure and smart systems' },
        { percentage: 35, description: 'Offices and residential towers' },
        { percentage: 25, description: 'Retail and community spaces' },
        { percentage: 10, description: 'Digital art installations and launch' }
      ]
    },
    {
      title: 'Seville Riverside Village',
      description: 'Waterfront mixed-use village featuring boutique hotels, artisan workshops, residential lofts, floating restaurants, and cultural spaces. Celebrates Andalusian heritage with modern amenities.',
      location: 'Guadalquivir Riverfront, Seville, Spain',
      targetAmount: 4200000,
      currency: 'EUR',
      expectedReturn: 12.7,
      duration: 42,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 6500,
      images: [
        'https://images.unsplash.com/photo-1543783207-ec64e4d95325',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43'
      ],
      documents: ['riverside_development_rights.pdf', 'heritage_integration_plan.pdf', 'floating_restaurant_permits.pdf'],
      milestones: [
        { percentage: 25, description: 'Riverside infrastructure and marina' },
        { percentage: 35, description: 'Hotels and residential buildings' },
        { percentage: 30, description: 'Artisan workshops and retail' },
        { percentage: 10, description: 'Cultural center and opening' }
      ]
    },
    {
      title: 'Madrid Sky Gardens Complex',
      description: 'Vertical mixed-use towers with sky bridges, featuring luxury residences, offices, vertical gardens, wellness centers, and rooftop entertainment. Connected by aerial walkways with panoramic city views.',
      location: 'Castellana Norte, Madrid, Spain',
      targetAmount: 7200000,
      currency: 'EUR',
      expectedReturn: 14.5,
      duration: 54,
      riskLevel: 'High',
      propertyType: 'Mixed-Use',
      minimumInvestment: 12000,
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945'
      ],
      documents: ['sky_bridge_engineering.pdf', 'vertical_garden_systems.pdf', 'luxury_brand_partnerships.pdf'],
      milestones: [
        { percentage: 35, description: 'Tower structures and sky bridges' },
        { percentage: 30, description: 'Residential and office fit-out' },
        { percentage: 25, description: 'Gardens and wellness centers' },
        { percentage: 10, description: 'Rooftop venues and completion' }
      ]
    },
    {
      title: 'Barcelona Beach Tech Campus',
      description: 'Beachfront mixed-use campus combining startup incubators, coliving spaces, beach clubs, sports facilities, and oceanfront dining. Designed for digital nomads and tech entrepreneurs.',
      location: 'Barceloneta Beach, Barcelona, Spain',
      targetAmount: 4800000,
      currency: 'EUR',
      expectedReturn: 13.2,
      duration: 36,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 7500,
      images: [
        'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57',
        'https://images.unsplash.com/photo-1497366216548-37526070297c',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'
      ],
      documents: ['beach_development_permits.pdf', 'tech_incubator_partnerships.pdf', 'coliving_operator_agreement.pdf'],
      milestones: [
        { percentage: 30, description: 'Beachfront infrastructure' },
        { percentage: 35, description: 'Tech spaces and coliving' },
        { percentage: 25, description: 'Beach clubs and restaurants' },
        { percentage: 10, description: 'Community launch and events' }
      ]
    },
    {
      title: 'Bilbao Creative Quarter',
      description: 'Urban regeneration project featuring design studios, maker spaces, affordable housing, galleries, performance venues, and creative retail. Anchored by expanded Guggenheim campus.',
      location: 'Zorrotzaurre Island, Bilbao, Spain',
      targetAmount: 5500000,
      currency: 'EUR',
      expectedReturn: 12.4,
      duration: 48,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 8000,
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'https://images.unsplash.com/photo-1555636222-cae831e670b3',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2'
      ],
      documents: ['guggenheim_partnership.pdf', 'creative_quarter_masterplan.pdf', 'affordable_housing_covenant.pdf'],
      milestones: [
        { percentage: 25, description: 'Infrastructure and public spaces' },
        { percentage: 35, description: 'Studios and residential units' },
        { percentage: 30, description: 'Galleries and performance spaces' },
        { percentage: 10, description: 'Creative community activation' }
      ]
    },
    {
      title: 'Malaga Health & Wellness City',
      description: 'Integrated wellness destination with medical clinics, spa hotels, senior living, fitness centers, organic markets, and healing gardens. Targeting health tourism and active retirement.',
      location: 'Teatinos University District, Malaga, Spain',
      targetAmount: 6300000,
      currency: 'EUR',
      expectedReturn: 13.7,
      duration: 45,
      riskLevel: 'Low',
      propertyType: 'Mixed-Use',
      minimumInvestment: 10000,
      images: [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
      ],
      documents: ['medical_tourism_analysis.pdf', 'wellness_operator_agreements.pdf', 'senior_living_permits.pdf'],
      milestones: [
        { percentage: 30, description: 'Medical facilities and infrastructure' },
        { percentage: 35, description: 'Hotels and senior residences' },
        { percentage: 25, description: 'Wellness centers and markets' },
        { percentage: 10, description: 'Garden completion and opening' }
      ]
    }
  ];

  // MEXICO MIXED-USE PROPERTIES (6)
  const mexicoMixedUse = [
    {
      title: 'Playa del Carmen Ocean Village',
      description: 'Beachfront eco-village with condos, boutique hotels, beach clubs, water sports center, organic restaurants, and marine conservation center. Sustainable luxury for conscious travelers.',
      location: 'Playacar, Playa del Carmen, Mexico',
      targetAmount: 24000000,
      currency: 'MXN',
      expectedReturn: 15.8,
      duration: 48,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 90000,
      images: [
        'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'
      ],
      documents: ['environmental_impact_study.pdf', 'beach_concession_rights.pdf', 'eco_certification_plan.pdf'],
      milestones: [
        { percentage: 30, description: 'Environmental protection measures' },
        { percentage: 35, description: 'Condos and hotel construction' },
        { percentage: 25, description: 'Beach clubs and restaurants' },
        { percentage: 10, description: 'Conservation center launch' }
      ]
    },
    {
      title: 'Mexico City Art District',
      description: 'Cultural mixed-use hub with artist residences, galleries, creative offices, artisan markets, performance spaces, and culinary experiences. Revitalizing historic Roma Norte neighborhood.',
      location: 'Roma Norte, Mexico City, Mexico',
      targetAmount: 18500000,
      currency: 'MXN',
      expectedReturn: 13.4,
      duration: 42,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 65000,
      images: [
        'https://images.unsplash.com/photo-1543783207-ec64e4d95325',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2'
      ],
      documents: ['cultural_district_permits.pdf', 'artist_residency_program.pdf', 'gallery_partnerships.pdf'],
      milestones: [
        { percentage: 25, description: 'Historic building restoration' },
        { percentage: 35, description: 'Residences and galleries' },
        { percentage: 30, description: 'Markets and performance spaces' },
        { percentage: 10, description: 'Art district inauguration' }
      ]
    },
    {
      title: 'Monterrey Innovation Hub',
      description: 'Tech-focused mixed-use with R&D labs, corporate housing, conference center, innovation museum, startup spaces, and entertainment. Creating Mexico\'s Silicon Valley ecosystem.',
      location: 'Valle Oriente, Monterrey, Mexico',
      targetAmount: 32000000,
      currency: 'MXN',
      expectedReturn: 14.9,
      duration: 54,
      riskLevel: 'Low',
      propertyType: 'Mixed-Use',
      minimumInvestment: 110000,
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158'
      ],
      documents: ['tech_park_masterplan.pdf', 'university_partnerships.pdf', 'corporate_pre_leases.pdf'],
      milestones: [
        { percentage: 35, description: 'R&D facilities and labs' },
        { percentage: 30, description: 'Housing and conference center' },
        { percentage: 25, description: 'Innovation spaces and museum' },
        { percentage: 10, description: 'Ecosystem launch events' }
      ]
    },
    {
      title: 'Oaxaca Heritage Quarter',
      description: 'Cultural preservation project with boutique hotels, mezcal distillery tours, artisan workshops, traditional markets, cooking schools, and indigenous art center. Celebrating local traditions.',
      location: 'Santo Domingo, Oaxaca, Mexico',
      targetAmount: 14800000,
      currency: 'MXN',
      expectedReturn: 13.1,
      duration: 36,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 50000,
      images: [
        'https://images.unsplash.com/photo-1543783207-ec64e4d95325',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
      ],
      documents: ['unesco_compliance.pdf', 'artisan_cooperative_agreements.pdf', 'mezcal_production_license.pdf'],
      milestones: [
        { percentage: 30, description: 'Heritage building restoration' },
        { percentage: 35, description: 'Hotels and distillery' },
        { percentage: 25, description: 'Workshops and markets' },
        { percentage: 10, description: 'Cultural program launch' }
      ]
    },
    {
      title: 'Tulum Wellness Sanctuary',
      description: 'Holistic wellness destination with healing center, yoga retreats, organic farms, cenote spa, meditation spaces, and conscious living residences. Integration with Mayan traditions.',
      location: 'Aldea Zama, Tulum, Mexico',
      targetAmount: 21000000,
      currency: 'MXN',
      expectedReturn: 14.6,
      duration: 42,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 75000,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
      ],
      documents: ['cenote_access_rights.pdf', 'wellness_center_certification.pdf', 'organic_farm_permits.pdf'],
      milestones: [
        { percentage: 30, description: 'Cenote preservation and spa' },
        { percentage: 35, description: 'Retreat centers and residences' },
        { percentage: 25, description: 'Organic farms and kitchens' },
        { percentage: 10, description: 'Wellness program activation' }
      ]
    },
    {
      title: 'Guadalajara Sports City',
      description: 'Athletic mixed-use complex with stadium, training facilities, sports medicine center, athlete housing, fan hotels, and entertainment district. Home to multiple professional teams.',
      location: 'Akron District, Guadalajara, Mexico',
      targetAmount: 28500000,
      currency: 'MXN',
      expectedReturn: 13.8,
      duration: 48,
      riskLevel: 'Low',
      propertyType: 'Mixed-Use',
      minimumInvestment: 100000,
      images: [
        'https://images.unsplash.com/photo-1541252260730-0412e8e2108e',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6'
      ],
      documents: ['stadium_development_rights.pdf', 'team_partnership_agreements.pdf', 'sports_tourism_analysis.pdf'],
      milestones: [
        { percentage: 35, description: 'Stadium and training facilities' },
        { percentage: 30, description: 'Medical center and housing' },
        { percentage: 25, description: 'Hotels and entertainment' },
        { percentage: 10, description: 'Grand opening events' }
      ]
    }
  ];

  // US/UK MIXED-USE PROPERTIES (6)
  const internationalMixedUse = [
    {
      title: 'Brooklyn Innovation Waterfront',
      description: 'Tech-creative mixed-use on Brooklyn waterfront with maker spaces, loft offices, artisan food hall, rooftop farms, and waterfront promenade. Connecting innovation with community.',
      location: 'Brooklyn Navy Yard, New York, USA',
      targetAmount: 7200000,
      currency: 'USD',
      expectedReturn: 12.9,
      duration: 48,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 22000,
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
      ],
      documents: ['waterfront_redevelopment.pdf', 'maker_space_partnerships.pdf', 'food_hall_vendors.pdf'],
      milestones: [
        { percentage: 30, description: 'Infrastructure and promenade' },
        { percentage: 35, description: 'Maker spaces and offices' },
        { percentage: 25, description: 'Food hall and retail' },
        { percentage: 10, description: 'Rooftop farms and opening' }
      ]
    },
    {
      title: 'Miami Design District Expansion',
      description: 'Luxury mixed-use expanding Miami Design District with flagship retail, penthouses, art galleries, design showrooms, and culinary experiences. Where art meets commerce.',
      location: 'Design District, Miami, Florida, USA',
      targetAmount: 8900000,
      currency: 'USD',
      expectedReturn: 13.5,
      duration: 42,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 28000,
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43'
      ],
      documents: ['design_district_expansion.pdf', 'luxury_brand_commitments.pdf', 'art_gallery_partnerships.pdf'],
      milestones: [
        { percentage: 30, description: 'Core structure and parking' },
        { percentage: 35, description: 'Retail and showrooms' },
        { percentage: 25, description: 'Penthouses and galleries' },
        { percentage: 10, description: 'Art program and launch' }
      ]
    },
    {
      title: 'London Thames Gateway',
      description: 'Riverside mixed-use regeneration with affordable housing, creative offices, public market, theater, marina, and riverside dining. Transforming East London\'s waterfront.',
      location: 'Greenwich Peninsula, London, UK',
      targetAmount: 7500000,
      currency: 'GBP',
      expectedReturn: 11.8,
      duration: 54,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 18000,
      images: [
        'https://images.unsplash.com/photo-1543783207-ec64e4d95325',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
      ],
      documents: ['thames_gateway_masterplan.pdf', 'affordable_housing_agreement.pdf', 'theater_operator_lease.pdf'],
      milestones: [
        { percentage: 30, description: 'Riverside infrastructure' },
        { percentage: 35, description: 'Housing and offices' },
        { percentage: 25, description: 'Market and theater' },
        { percentage: 10, description: 'Marina and completion' }
      ]
    },
    {
      title: 'Denver Union Station District',
      description: 'Transit-oriented mixed-use around historic Union Station with boutique hotels, tech offices, craft breweries, urban farms, and cultural venues. Sustainable urban living model.',
      location: 'LoDo, Denver, Colorado, USA',
      targetAmount: 5600000,
      currency: 'USD',
      expectedReturn: 12.7,
      duration: 42,
      riskLevel: 'Low',
      propertyType: 'Mixed-Use',
      minimumInvestment: 16000,
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'
      ],
      documents: ['transit_oriented_development.pdf', 'historic_preservation_plan.pdf', 'brewery_partnerships.pdf'],
      milestones: [
        { percentage: 25, description: 'Historic preservation work' },
        { percentage: 35, description: 'Hotels and offices' },
        { percentage: 30, description: 'Breweries and farms' },
        { percentage: 10, description: 'Cultural venue opening' }
      ]
    },
    {
      title: 'Manchester MediaCity Phase 2',
      description: 'Digital media mixed-use expanding MediaCity with production studios, creative offices, talent housing, screening rooms, and tech education center. UK\'s creative industry hub.',
      location: 'Salford Quays, Manchester, UK',
      targetAmount: 6200000,
      currency: 'GBP',
      expectedReturn: 12.4,
      duration: 48,
      riskLevel: 'Low',
      propertyType: 'Mixed-Use',
      minimumInvestment: 14000,
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8'
      ],
      documents: ['medacity_expansion_plan.pdf', 'bbc_partnership_agreement.pdf', 'education_center_funding.pdf'],
      milestones: [
        { percentage: 35, description: 'Production studios' },
        { percentage: 30, description: 'Offices and housing' },
        { percentage: 25, description: 'Education and screening' },
        { percentage: 10, description: 'Industry launch events' }
      ]
    },
    {
      title: 'San Francisco Mission Bay Life',
      description: 'Biotech-residential mixed-use in Mission Bay with lab spaces, workforce housing, health clinics, organic grocers, and waterfront parks. Live-work community for life sciences.',
      location: 'Mission Bay, San Francisco, USA',
      targetAmount: 9400000,
      currency: 'USD',
      expectedReturn: 13.2,
      duration: 45,
      riskLevel: 'Medium',
      propertyType: 'Mixed-Use',
      minimumInvestment: 30000,
      images: [
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
        'https://images.unsplash.com/photo-1497366216548-37526070297c'
      ],
      documents: ['biotech_cluster_plan.pdf', 'workforce_housing_covenant.pdf', 'health_clinic_partnerships.pdf'],
      milestones: [
        { percentage: 35, description: 'Lab spaces and infrastructure' },
        { percentage: 30, description: 'Workforce housing' },
        { percentage: 25, description: 'Retail and clinics' },
        { percentage: 10, description: 'Parks and activation' }
      ]
    }
  ];

  const allProperties = [...spainMixedUse, ...mexicoMixedUse, ...internationalMixedUse];
  
  let created = 0;
  for (const property of allProperties) {
    try {
      const response = await fetch('http://localhost:3002/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(property)
      });

      if (response.ok) {
        created++;
        console.log(`✅ ${created}/18: ${property.title}`);
      } else {
        const error = await response.json();
        console.log(`❌ Failed: ${property.title} - ${error.error || error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${property.title} - ${error.message}`);
    }
  }

  console.log(`\n🏙️ Created ${created} mixed-use properties successfully!`);
  console.log('\n📊 Mixed-Use Portfolio Features:');
  console.log('• Live-Work-Play Integration');
  console.log('• Community-Focused Design');
  console.log('• Sustainable Development');
  console.log('• Cultural Preservation');
  console.log('• Innovation Ecosystems');
}

createMixedUsePortfolio().catch(console.error);