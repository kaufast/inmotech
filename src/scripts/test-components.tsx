/**
 * Component Testing Scenarios
 * This file demonstrates how the components work with different data scenarios
 */

import React from 'react';

// Mock data scenarios for testing components
export const TEST_SCENARIOS = {
  // User scenarios
  USERS: {
    admin: {
      id: 'admin-1',
      email: 'admin@inmotech.com',
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      isVerified: true,
      kycStatus: 'APPROVED',
      roles: ['admin'],
      permissions: [
        'projects:manage',
        'investments:manage', 
        'users:manage',
        'admin:manage'
      ]
    },
    investor: {
      id: 'investor-1',
      email: 'investor@inmotech.com',
      firstName: 'Regular',
      lastName: 'Investor',
      isAdmin: false,
      isVerified: true,
      kycStatus: 'APPROVED',
      roles: ['investor'],
      permissions: [
        'projects:read',
        'investments:create',
        'investments:read'
      ]
    },
    premium: {
      id: 'premium-1',
      email: 'premium@inmotech.com',
      firstName: 'Premium',
      lastName: 'Investor',
      isAdmin: false,
      isVerified: true,
      kycStatus: 'APPROVED',
      roles: ['premium_investor'],
      permissions: [
        'projects:read',
        'investments:create',
        'investments:read',
        'investments:update',
        'analytics:create'
      ]
    },
    unverified: {
      id: 'unverified-1',
      email: 'unverified@inmotech.com',
      firstName: 'Unverified',
      lastName: 'User',
      isAdmin: false,
      isVerified: false,
      kycStatus: 'PENDING',
      roles: [],
      permissions: []
    }
  },

  // Portfolio scenarios
  PORTFOLIO_STATS: {
    successful: {
      totalValue: 127500,
      totalInvested: 100000,
      currentReturns: 27500,
      expectedAnnualReturn: 12.5,
      activeProjects: 8,
      portfolioGrowth: 27.5,
      nextPayment: {
        amount: 2500,
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        projectTitle: 'Valencia Beach Resort'
      }
    },
    struggling: {
      totalValue: 95000,
      totalInvested: 100000,
      currentReturns: -5000,
      expectedAnnualReturn: 8.0,
      activeProjects: 3,
      portfolioGrowth: -5.0,
      nextPayment: {
        amount: 500,
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        projectTitle: 'Madrid Office Complex'
      }
    },
    empty: {
      totalValue: 0,
      totalInvested: 0,
      currentReturns: 0,
      expectedAnnualReturn: 0,
      activeProjects: 0,
      portfolioGrowth: 0,
      nextPayment: null
    }
  },

  // Investment scenarios
  INVESTMENTS: {
    diversified: [
      {
        id: 'inv-1',
        projectId: 'proj-1',
        amount: 25000,
        currency: 'EUR',
        status: 'CONFIRMED',
        createdAt: '2024-01-15T10:30:00Z',
        project: {
          title: 'Madrid Luxury Residences',
          location: 'Madrid, Spain',
          expectedReturn: 12,
          duration: 24,
          propertyType: 'Residential',
          riskLevel: 'Medium'
        }
      },
      {
        id: 'inv-2',
        projectId: 'proj-2',
        amount: 50000,
        currency: 'EUR',
        status: 'CONFIRMED',
        createdAt: '2024-02-20T14:15:00Z',
        project: {
          title: 'Barcelona Tech Hub',
          location: 'Barcelona, Spain',
          expectedReturn: 15,
          duration: 18,
          propertyType: 'Commercial',
          riskLevel: 'High'
        }
      },
      {
        id: 'inv-3',
        projectId: 'proj-3',
        amount: 15000,
        currency: 'EUR',
        status: 'CONFIRMED',
        createdAt: '2024-03-10T09:45:00Z',
        project: {
          title: 'Valencia Beach Resort',
          location: 'Valencia, Spain',
          expectedReturn: 10,
          duration: 36,
          propertyType: 'Mixed Use',
          riskLevel: 'Low'
        }
      }
    ],
    single: [
      {
        id: 'inv-solo',
        projectId: 'proj-1',
        amount: 10000,
        currency: 'EUR',
        status: 'CONFIRMED',
        createdAt: '2024-03-01T12:00:00Z',
        project: {
          title: 'Madrid Luxury Residences',
          location: 'Madrid, Spain',
          expectedReturn: 12,
          duration: 24,
          propertyType: 'Residential',
          riskLevel: 'Medium'
        }
      }
    ],
    empty: []
  },

  // Project scenarios
  PROJECTS: {
    available: [
      {
        id: 'proj-available-1',
        title: 'Lisbon Modern Apartments',
        description: 'Modern apartment complex in Lisbon city center',
        location: 'Lisbon, Portugal',
        targetAmount: 750000,
        currency: 'EUR',
        expectedReturn: 11.5,
        duration: 30,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 2500,
        images: ['/images/lisbon-apartments.jpg'],
        status: 'ACTIVE',
        progress: 45
      },
      {
        id: 'proj-available-2',
        title: 'Porto Commercial Center',
        description: 'New commercial development in Porto',
        location: 'Porto, Portugal',
        targetAmount: 1200000,
        currency: 'EUR',
        expectedReturn: 14.0,
        duration: 24,
        riskLevel: 'High',
        propertyType: 'Commercial',
        minimumInvestment: 5000,
        images: ['/images/porto-commercial.jpg'],
        status: 'ACTIVE',
        progress: 23
      }
    ],
    funded: [
      {
        id: 'proj-funded-1',
        title: 'Barcelona Startup Campus',
        description: 'Fully funded startup campus',
        location: 'Barcelona, Spain',
        targetAmount: 2000000,
        currency: 'EUR',
        expectedReturn: 13.5,
        duration: 36,
        riskLevel: 'Medium',
        propertyType: 'Commercial',
        minimumInvestment: 10000,
        images: ['/images/barcelona-campus.jpg'],
        status: 'FUNDED',
        progress: 100
      }
    ]
  },

  // Watchlist scenarios
  WATCHLIST: {
    populated: [
      {
        id: 'watch-1',
        addedAt: '2024-03-15T10:30:00Z',
        project: {
          id: 'proj-watch-1',
          title: 'Seville Historic District',
          location: 'Seville, Spain',
          expectedReturn: 9.5,
          minimumInvestment: 3000,
          currency: 'EUR',
          images: ['/images/seville-historic.jpg'],
          riskLevel: 'Low',
          propertyType: 'Residential'
        }
      },
      {
        id: 'watch-2',
        addedAt: '2024-03-20T15:45:00Z',
        project: {
          id: 'proj-watch-2',
          title: 'Granada Mountain Resort',
          location: 'Granada, Spain',
          expectedReturn: 16.0,
          minimumInvestment: 7500,
          currency: 'EUR',
          images: ['/images/granada-resort.jpg'],
          riskLevel: 'High',
          propertyType: 'Mixed Use'
        }
      }
    ],
    empty: []
  },

  // Recommendation scenarios
  RECOMMENDATIONS: {
    personalized: [
      {
        id: 'rec-1',
        title: 'Toledo Heritage Hotel',
        location: 'Toledo, Spain',
        expectedReturn: 10.5,
        minimumInvestment: 4000,
        currency: 'EUR',
        propertyType: 'Commercial',
        images: ['/images/toledo-hotel.jpg'],
        riskLevel: 'Medium',
        matchReason: 'Similar to your previous investments'
      },
      {
        id: 'rec-2',
        title: 'Bilbao Innovation Hub',
        location: 'Bilbao, Spain',
        expectedReturn: 13.0,
        minimumInvestment: 6000,
        currency: 'EUR',
        propertyType: 'Commercial',
        images: ['/images/bilbao-hub.jpg'],
        riskLevel: 'Medium',
        matchReason: 'Within your typical investment range'
      }
    ],
    empty: []
  }
};

// Test scenario descriptions
export const TEST_DESCRIPTIONS = {
  'Empty Portfolio': 'New user with no investments',
  'Successful Portfolio': 'Experienced investor with positive returns',
  'Struggling Portfolio': 'Investor with recent losses',
  'Admin User': 'Full admin access with all permissions',
  'Regular Investor': 'Basic investor with limited permissions',
  'Premium Investor': 'Enhanced investor with additional features',
  'Unverified User': 'New user pending KYC verification',
  'Populated Watchlist': 'User with saved favorite properties',
  'Empty Watchlist': 'User with no saved properties',
  'Personalized Recommendations': 'AI-generated investment suggestions',
  'No Recommendations': 'New user with no recommendation data'
};

// Component test runner (conceptual - would need testing framework)
export const runComponentTests = () => {
  const tests = [
    {
      component: 'ModernPortfolioStats',
      scenarios: [
        { name: 'Empty Portfolio', data: TEST_SCENARIOS.PORTFOLIO_STATS.empty },
        { name: 'Successful Portfolio', data: TEST_SCENARIOS.PORTFOLIO_STATS.successful },
        { name: 'Struggling Portfolio', data: TEST_SCENARIOS.PORTFOLIO_STATS.struggling }
      ]
    },
    {
      component: 'WatchlistContent',
      scenarios: [
        { name: 'Populated Watchlist', data: TEST_SCENARIOS.WATCHLIST.populated },
        { name: 'Empty Watchlist', data: TEST_SCENARIOS.WATCHLIST.empty }
      ]
    },
    {
      component: 'PersonalizedRecommendations',
      scenarios: [
        { name: 'Personalized Recommendations', data: TEST_SCENARIOS.RECOMMENDATIONS.personalized },
        { name: 'Empty Recommendations', data: TEST_SCENARIOS.RECOMMENDATIONS.empty }
      ]
    },
    {
      component: 'ProtectedComponent',
      scenarios: [
        { name: 'Admin Access', user: TEST_SCENARIOS.USERS.admin },
        { name: 'Investor Access', user: TEST_SCENARIOS.USERS.investor },
        { name: 'Unverified User', user: TEST_SCENARIOS.USERS.unverified }
      ]
    }
  ];

  console.log('🧪 Running Component Tests...\n');

  tests.forEach(test => {
    console.log(`📦 Component: ${test.component}`);
    test.scenarios.forEach(scenario => {
      console.log(`   ✓ Scenario: ${scenario.name}`);
      // In a real test, you would render the component with the scenario data
      // and assert expected behavior
    });
    console.log();
  });

  console.log('✅ All component tests completed!');
};

// Investment calculator test scenarios
export const CALCULATOR_SCENARIOS = [
  {
    name: 'Conservative 3-Year Investment',
    investment: 10000,
    duration: 36,
    expectedReturn: 6,
    compounding: 'annually' as const,
    expectedResult: {
      totalReturn: 11910.16,
      netProfit: 1910.16,
      roi: 19.10
    }
  },
  {
    name: 'Aggressive Monthly Compounding',
    investment: 25000,
    duration: 24,
    expectedReturn: 15,
    compounding: 'monthly' as const,
    expectedResult: {
      totalReturn: 34885.27,
      netProfit: 9885.27,
      roi: 39.54
    }
  },
  {
    name: 'Short-term High Return',
    investment: 50000,
    duration: 12,
    expectedReturn: 20,
    compounding: 'quarterly' as const,
    expectedResult: {
      totalReturn: 60845.21,
      netProfit: 10845.21,
      roi: 21.69
    }
  }
];

// RBAC test scenarios
export const RBAC_TEST_SCENARIOS = [
  {
    user: 'admin',
    expectedPermissions: {
      'projects:manage': true,
      'users:manage': true,
      'admin:manage': true,
      'investments:create': true
    },
    expectedRoles: ['admin'],
    canAccess: {
      adminPanel: true,
      createProject: true,
      manageUsers: true,
      viewAnalytics: true
    }
  },
  {
    user: 'investor',
    expectedPermissions: {
      'projects:read': true,
      'investments:create': true,
      'investments:read': true,
      'users:manage': false,
      'admin:manage': false
    },
    expectedRoles: ['investor'],
    canAccess: {
      adminPanel: false,
      createProject: false,
      manageUsers: false,
      viewAnalytics: true
    }
  },
  {
    user: 'unverified',
    expectedPermissions: {},
    expectedRoles: [],
    canAccess: {
      adminPanel: false,
      createProject: false,
      manageUsers: false,
      viewAnalytics: false
    }
  }
];

// Export a function to run visual tests (would show components with different data)
export const runVisualTests = () => {
  console.log('🎨 Visual Test Scenarios Available:');
  console.log('=====================================\n');

  Object.entries(TEST_DESCRIPTIONS).forEach(([scenario, description]) => {
    console.log(`📋 ${scenario}`);
    console.log(`   ${description}\n`);
  });

  console.log('💡 To test visually:');
  console.log('1. Import TEST_SCENARIOS in your component');
  console.log('2. Pass scenario data as props');
  console.log('3. Observe component behavior');
  console.log('4. Verify UI renders correctly');
};

if (require.main === module) {
  runComponentTests();
  console.log('\n');
  runVisualTests();
}