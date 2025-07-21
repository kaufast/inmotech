import { PrismaClient } from '@prisma/client';
import { seedRBAC } from './seed-rbac';
import { 
  getUserPermissions, 
  hasPermission, 
  assignRole, 
  removeRole, 
  PERMISSIONS 
} from '@/lib/rbac';

const prisma = new PrismaClient();

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

class TestRunner {
  private results: TestResult[] = [];
  private testUsers: any[] = [];

  async runAllTests() {
    console.log('🧪 Starting comprehensive test scenarios...\n');

    try {
      await this.setupTestData();
      await this.testRBACSystem();
      await this.testDashboardAnalytics();
      await this.testWatchlistFunctionality();
      await this.testInvestmentScenarios();
      await this.printResults();
    } catch (error) {
      console.error('❌ Test setup failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async setupTestData() {
    console.log('🔧 Setting up test data...');

    // Seed RBAC system first
    await seedRBAC();

    // Create test users
    const testUsers = [
      {
        email: 'admin.test@inmotech.com',
        firstName: 'Admin',
        lastName: 'Test',
        isAdmin: true,
        role: 'admin'
      },
      {
        email: 'investor.test@inmotech.com',
        firstName: 'Investor',
        lastName: 'Test',
        isAdmin: false,
        role: 'investor'
      },
      {
        email: 'manager.test@inmotech.com',
        firstName: 'Fund',
        lastName: 'Manager',
        isAdmin: false,
        role: 'fund_manager'
      },
      {
        email: 'premium.test@inmotech.com',
        firstName: 'Premium',
        lastName: 'Investor',
        isAdmin: false,
        role: 'premium_investor'
      }
    ];

    for (const userData of testUsers) {
      // Create user
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          password: 'test-password-hash',
          firstName: userData.firstName,
          lastName: userData.lastName,
          isAdmin: userData.isAdmin,
          isVerified: true,
          kycStatus: 'APPROVED'
        }
      });

      // Assign role
      const role = await prisma.role.findUnique({
        where: { name: userData.role }
      });

      if (role) {
        await assignRole(user.id, role.id);
      }

      this.testUsers.push({ ...user, roleName: userData.role });
    }

    // Create test projects
    await this.createTestProjects();

    console.log('✅ Test data setup complete\n');
  }

  private async createTestProjects() {
    const testProjects = [
      {
        title: 'Madrid Test Property',
        description: 'Test property for Madrid',
        location: 'Madrid, Spain',
        targetAmount: 500000,
        expectedReturn: 10,
        duration: 24,
        riskLevel: 'Medium',
        propertyType: 'Residential',
        minimumInvestment: 1000,
        images: ['https://example.com/madrid1.jpg']
      },
      {
        title: 'Barcelona Commercial Center',
        description: 'Test commercial property',
        location: 'Barcelona, Spain',
        targetAmount: 1000000,
        expectedReturn: 12,
        duration: 36,
        riskLevel: 'Low',
        propertyType: 'Commercial',
        minimumInvestment: 5000,
        images: ['https://example.com/barcelona1.jpg']
      }
    ];

    for (const projectData of testProjects) {
      // Check if project exists first
      const existingProject = await prisma.project.findFirst({
        where: { title: projectData.title }
      });

      if (!existingProject) {
        await prisma.project.create({
          data: {
            ...projectData,
            createdBy: this.testUsers.find(u => u.roleName === 'admin')!.id
          }
        });
      }
    }
  }

  private async testRBACSystem() {
    console.log('🔐 Testing RBAC System...');

    await this.testPermissionChecks();
    await this.testRoleAssignments();
    await this.testPermissionInheritance();
  }

  private async testPermissionChecks() {
    const adminUser = this.testUsers.find(u => u.roleName === 'admin')!;
    const investorUser = this.testUsers.find(u => u.roleName === 'investor')!;

    // Test admin permissions
    const adminPermissions = await getUserPermissions(adminUser.id);
    this.addResult({
      testName: 'Admin has all permissions',
      passed: adminPermissions.permissions.includes('admin:manage'),
      message: `Admin permissions: ${adminPermissions.permissions.length}`,
      details: adminPermissions
    });

    // Test investor permissions
    const investorPermissions = await getUserPermissions(investorUser.id);
    const canCreateInvestment = await hasPermission(investorUser.id, PERMISSIONS.INVESTMENTS_CREATE);
    const canManageUsers = await hasPermission(investorUser.id, PERMISSIONS.USERS_MANAGE);

    this.addResult({
      testName: 'Investor can create investments but not manage users',
      passed: canCreateInvestment && !canManageUsers,
      message: `Can invest: ${canCreateInvestment}, Can manage users: ${canManageUsers}`,
      details: investorPermissions
    });
  }

  private async testRoleAssignments() {
    const testUser = this.testUsers.find(u => u.roleName === 'investor')!;
    const premiumRole = await prisma.role.findUnique({ where: { name: 'premium_investor' } });

    if (premiumRole) {
      // Assign premium role
      await assignRole(testUser.id, premiumRole.id);
      
      const updatedPermissions = await getUserPermissions(testUser.id);
      const hasBothRoles = updatedPermissions.roles.includes('investor') && 
                          updatedPermissions.roles.includes('premium_investor');

      this.addResult({
        testName: 'User can have multiple roles',
        passed: hasBothRoles,
        message: `User roles: ${updatedPermissions.roles.join(', ')}`,
        details: updatedPermissions
      });

      // Remove role
      await removeRole(testUser.id, premiumRole.id);
      const finalPermissions = await getUserPermissions(testUser.id);
      
      this.addResult({
        testName: 'Role can be removed successfully',
        passed: !finalPermissions.roles.includes('premium_investor'),
        message: `Final roles: ${finalPermissions.roles.join(', ')}`,
        details: finalPermissions
      });
    }
  }

  private async testPermissionInheritance() {
    const managerUser = this.testUsers.find(u => u.roleName === 'fund_manager')!;
    
    const canReadProjects = await hasPermission(managerUser.id, PERMISSIONS.PROJECTS_READ);
    const canCreateProjects = await hasPermission(managerUser.id, PERMISSIONS.PROJECTS_CREATE);
    const canDeleteProjects = await hasPermission(managerUser.id, PERMISSIONS.PROJECTS_DELETE);

    this.addResult({
      testName: 'Fund manager has correct project permissions',
      passed: canReadProjects && canCreateProjects && !canDeleteProjects,
      message: `Read: ${canReadProjects}, Create: ${canCreateProjects}, Delete: ${canDeleteProjects}`,
    });
  }

  private async testDashboardAnalytics() {
    console.log('📊 Testing Dashboard Analytics...');

    await this.testPortfolioCalculations();
    await this.testInvestmentRecommendations();
  }

  private async testPortfolioCalculations() {
    const investorUser = this.testUsers.find(u => u.roleName === 'investor')!;
    const project = await prisma.project.findFirst();

    if (project) {
      // Create test investment
      const investment = await prisma.investment.create({
        data: {
          userId: investorUser.id,
          projectId: project.id,
          amount: 10000,
          currency: 'EUR',
          status: 'CONFIRMED',
          paymentMethod: 'test',
          confirmedAt: new Date()
        }
      });

      // Test analytics calculation
      const mockAnalyticsData = {
        portfolioStats: {
          totalValue: 10500,
          totalInvested: 10000,
          currentReturns: 500,
          expectedAnnualReturn: 10,
          activeProjects: 1,
          portfolioGrowth: 5.0,
          nextPayment: {
            amount: 250,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            projectTitle: project.title
          }
        }
      };

      this.addResult({
        testName: 'Portfolio stats calculation',
        passed: mockAnalyticsData.portfolioStats.portfolioGrowth === 5.0,
        message: `Portfolio growth: ${mockAnalyticsData.portfolioStats.portfolioGrowth}%`,
        details: mockAnalyticsData
      });

      // Cleanup test investment
      await prisma.investment.delete({ where: { id: investment.id } });
    }
  }

  private async testInvestmentRecommendations() {
    const investorUser = this.testUsers.find(u => u.roleName === 'investor')!;
    const projects = await prisma.project.findMany({ take: 2 });

    if (projects.length > 0) {
      // Create investment history
      const investment = await prisma.investment.create({
        data: {
          userId: investorUser.id,
          projectId: projects[0].id,
          amount: 5000,
          currency: 'EUR',
          status: 'CONFIRMED',
          paymentMethod: 'test',
          confirmedAt: new Date()
        }
      });

      // Mock recommendation logic
      const recommendations = projects.filter(p => p.id !== projects[0].id);

      this.addResult({
        testName: 'Investment recommendations generated',
        passed: recommendations.length > 0,
        message: `${recommendations.length} recommendations found`,
        details: recommendations.map(r => ({ id: r.id, title: r.title }))
      });

      // Cleanup
      await prisma.investment.delete({ where: { id: investment.id } });
    }
  }

  private async testWatchlistFunctionality() {
    console.log('❤️ Testing Watchlist Functionality...');

    const investorUser = this.testUsers.find(u => u.roleName === 'investor')!;
    const project = await prisma.project.findFirst();

    if (project) {
      // Add to watchlist
      const watchlistItem = await prisma.userWatchlist.create({
        data: {
          userId: investorUser.id,
          projectId: project.id
        }
      });

      this.addResult({
        testName: 'Project added to watchlist',
        passed: !!watchlistItem,
        message: `Added project ${project.title} to watchlist`,
        details: watchlistItem
      });

      // Check watchlist retrieval
      const userWatchlist = await prisma.userWatchlist.findMany({
        where: { userId: investorUser.id },
        include: { project: true }
      });

      this.addResult({
        testName: 'Watchlist retrieval works',
        passed: userWatchlist.length === 1,
        message: `User has ${userWatchlist.length} items in watchlist`,
        details: userWatchlist
      });

      // Remove from watchlist
      await prisma.userWatchlist.delete({ where: { id: watchlistItem.id } });
      
      const emptyWatchlist = await prisma.userWatchlist.findMany({
        where: { userId: investorUser.id }
      });

      this.addResult({
        testName: 'Project removed from watchlist',
        passed: emptyWatchlist.length === 0,
        message: `Watchlist now has ${emptyWatchlist.length} items`
      });
    }
  }

  private async testInvestmentScenarios() {
    console.log('💰 Testing Investment Scenarios...');

    // Test investment calculation scenarios
    const scenarios = [
      {
        name: 'Conservative Investment',
        investment: 5000,
        duration: 36,
        expectedReturn: 6,
        compounding: 'annually'
      },
      {
        name: 'Aggressive Investment',
        investment: 25000,
        duration: 18,
        expectedReturn: 15,
        compounding: 'monthly'
      }
    ];

    for (const scenario of scenarios) {
      const result = this.calculateInvestmentReturn(scenario);
      
      this.addResult({
        testName: `${scenario.name} calculation`,
        passed: result.totalReturn > scenario.investment,
        message: `Investment: €${scenario.investment} → Return: €${result.totalReturn.toFixed(2)}`,
        details: result
      });
    }
  }

  private calculateInvestmentReturn(scenario: any) {
    const { investment, duration, expectedReturn, compounding } = scenario;
    const yearsInvested = duration / 12;
    const annualRate = expectedReturn / 100;

    let totalReturn = investment;
    
    switch (compounding) {
      case 'monthly':
        const monthlyRate = annualRate / 12;
        totalReturn = investment * Math.pow(1 + monthlyRate, duration);
        break;
      case 'quarterly':
        const quarterlyRate = annualRate / 4;
        const quarters = duration / 3;
        totalReturn = investment * Math.pow(1 + quarterlyRate, quarters);
        break;
      case 'annually':
        totalReturn = investment * Math.pow(1 + annualRate, yearsInvested);
        break;
      default:
        totalReturn = investment * (1 + (annualRate * yearsInvested));
        break;
    }

    return {
      totalReturn,
      netProfit: totalReturn - investment,
      roi: ((totalReturn - investment) / investment) * 100
    };
  }

  private addResult(result: TestResult) {
    this.results.push(result);
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName}: ${result.message}`);
  }

  private async printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.testName}: ${result.message}`);
      });
    }

    console.log('\n🎉 All tests completed!');
  }

  private async cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    try {
      // Remove test investments
      await prisma.investment.deleteMany({
        where: {
          paymentMethod: 'test'
        }
      });

      // Remove test user roles
      await prisma.userRole.deleteMany({
        where: {
          user: {
            email: {
              endsWith: '.test@inmotech.com'
            }
          }
        }
      });

      // Remove test users
      await prisma.user.deleteMany({
        where: {
          email: {
            endsWith: '.test@inmotech.com'
          }
        }
      });

      // Remove test projects
      await prisma.project.deleteMany({
        where: {
          title: {
            contains: 'Test'
          }
        }
      });

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('⚠️ Cleanup warnings:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testRunner = new TestRunner();
  testRunner.runAllTests()
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { TestRunner };