#!/usr/bin/env node

/**
 * Master Test Runner for InmoTech Platform
 * Runs all test scenarios including database, API, and component tests
 */

import { TestRunner } from './test-scenarios';
import { APITester, AuthenticatedAPITester, LoadTester } from './test-api-endpoints';
import { runComponentTests, runVisualTests } from './test-components';

interface TestSuite {
  name: string;
  runner: () => Promise<void>;
  description: string;
}

class MasterTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Database & RBAC Tests',
      runner: async () => {
        const testRunner = new TestRunner();
        await testRunner.runAllTests();
      },
      description: 'Tests database operations, RBAC system, and business logic'
    },
    {
      name: 'API Endpoint Tests',
      runner: async () => {
        console.log('🌐 Testing API Endpoints...\n');
        
        const basicTester = new APITester();
        await basicTester.runTests();
        
        console.log('\n');
        
        const authTester = new AuthenticatedAPITester();
        await authTester.runAuthenticatedTests();
      },
      description: 'Tests REST API endpoints with various authentication states'
    },
    {
      name: 'Load Tests',
      runner: async () => {
        const loadTester = new LoadTester();
        await loadTester.runLoadTests();
      },
      description: 'Tests system performance under concurrent load'
    },
    {
      name: 'Component Tests',
      runner: async () => {
        runComponentTests();
        console.log('\n');
        runVisualTests();
      },
      description: 'Tests React components with various data scenarios'
    }
  ];

  async runAll() {
    console.log('🚀 InmoTech Platform - Complete Test Suite');
    console.log('===========================================\n');

    const startTime = Date.now();
    let successfulSuites = 0;

    for (const suite of this.testSuites) {
      try {
        console.log(`📦 Running: ${suite.name}`);
        console.log(`   ${suite.description}\n`);
        
        await suite.runner();
        successfulSuites++;
        
        console.log(`✅ ${suite.name} completed successfully\n`);
        console.log('─'.repeat(60) + '\n');
      } catch (error) {
        console.log(`❌ ${suite.name} failed:`, error);
        console.log('─'.repeat(60) + '\n');
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    this.printFinalSummary(successfulSuites, duration);
  }

  async runSuite(suiteName: string) {
    const suite = this.testSuites.find(s => 
      s.name.toLowerCase().includes(suiteName.toLowerCase())
    );

    if (!suite) {
      console.log(`❌ Test suite "${suiteName}" not found`);
      console.log('Available suites:');
      this.testSuites.forEach(s => console.log(`   • ${s.name}`));
      return;
    }

    console.log(`🎯 Running specific test suite: ${suite.name}`);
    console.log(`   ${suite.description}\n`);

    try {
      await suite.runner();
      console.log(`✅ ${suite.name} completed successfully`);
    } catch (error) {
      console.log(`❌ ${suite.name} failed:`, error);
    }
  }

  listSuites() {
    console.log('📋 Available Test Suites:');
    console.log('========================\n');

    this.testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite.name}`);
      console.log(`   ${suite.description}`);
      console.log();
    });
  }

  private printFinalSummary(successful: number, duration: number) {
    console.log('🏁 FINAL TEST SUMMARY');
    console.log('=====================\n');

    console.log(`Total Test Suites: ${this.testSuites.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${this.testSuites.length - successful}`);
    console.log(`⏱️ Total Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📊 Success Rate: ${((successful / this.testSuites.length) * 100).toFixed(1)}%`);

    if (successful === this.testSuites.length) {
      console.log('\n🎉 All test suites passed! The platform is working correctly.');
    } else {
      console.log('\n⚠️ Some test suites failed. Please check the logs above for details.');
    }

    console.log('\n💡 Individual test commands:');
    console.log('   npm run test:db       - Database & RBAC tests');
    console.log('   npm run test:api      - API endpoint tests');
    console.log('   npm run test:load     - Load testing');
    console.log('   npm run test:components - Component tests');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const testRunner = new MasterTestRunner();

  switch (command) {
    case 'list':
    case '--list':
    case '-l':
      testRunner.listSuites();
      break;
    
    case 'suite':
    case '--suite':
    case '-s':
      if (args[1]) {
        await testRunner.runSuite(args[1]);
      } else {
        console.log('❌ Please specify a test suite name');
        testRunner.listSuites();
      }
      break;
    
    case 'help':
    case '--help':
    case '-h':
      console.log('InmoTech Test Runner Usage:');
      console.log('==========================\n');
      console.log('Commands:');
      console.log('  npm run test           - Run all test suites');
      console.log('  npm run test -- list   - List available test suites');
      console.log('  npm run test -- suite <name> - Run specific test suite');
      console.log('  npm run test -- help   - Show this help message\n');
      console.log('Examples:');
      console.log('  npm run test -- suite api');
      console.log('  npm run test -- suite database');
      console.log('  npm run test -- list');
      break;
    
    default:
      await testRunner.runAll();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

export { MasterTestRunner };