#!/usr/bin/env node

/**
 * AWS SES Email Service Test Script
 * Tests all email functionality in the InmoTech platform
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { emailService } from '../lib/email';

interface TestCase {
  name: string;
  test: () => Promise<void>;
  skipInSandbox?: boolean;
}

class EmailServiceTester {
  private testEmail: string;
  private results: { name: string; passed: boolean; error?: string }[] = [];

  constructor(testEmail?: string) {
    this.testEmail = testEmail || process.env.TEST_EMAIL || 'test@example.com';
  }

  async runTests() {
    console.log('🧪 AWS SES Email Service Test');
    console.log('=============================\n');

    // Check configuration
    await this.checkConfiguration();

    // Define test cases
    const testCases: TestCase[] = [
      {
        name: 'Send Simple Email',
        test: async () => {
          await emailService.sendEmail(
            this.testEmail,
            'InmoTech Test - Simple Email',
            '<h1>Test Email</h1><p>This is a simple test email.</p>',
            'Test Email\n\nThis is a simple test email.'
          );
        }
      },
      {
        name: 'Send Welcome Email',
        test: async () => {
          await emailService.sendWelcomeEmail(
            this.testEmail,
            'Test User',
            'test-verification-token-123'
          );
        }
      },
      {
        name: 'Send Password Reset Email',
        test: async () => {
          await emailService.sendPasswordResetEmail(
            this.testEmail,
            'Test User',
            'test-reset-token-456'
          );
        }
      },
      {
        name: 'Send Investment Confirmation',
        test: async () => {
          await emailService.sendInvestmentConfirmation(
            this.testEmail,
            {
              firstName: 'Test User',
              projectTitle: 'Madrid Luxury Residences',
              amount: '10,000',
              currency: 'EUR',
              transactionId: 'TEST-INV-789'
            }
          );
        }
      },
      {
        name: 'Send with Special Characters',
        test: async () => {
          await emailService.sendEmail(
            this.testEmail,
            'InmoTech Test - Special Characters €£¥',
            '<h1>Special Characters Test</h1><p>Testing: €10,000 • £8,000 • ¥1,200,000</p>',
            'Special Characters Test\n\nTesting: €10,000 • £8,000 • ¥1,200,000'
          );
        }
      },
      {
        name: 'Send with Long Content',
        test: async () => {
          const longContent = 'Lorem ipsum dolor sit amet. '.repeat(100);
          await emailService.sendEmail(
            this.testEmail,
            'InmoTech Test - Long Content',
            `<h1>Long Content Test</h1><p>${longContent}</p>`,
            `Long Content Test\n\n${longContent}`
          );
        },
        skipInSandbox: true
      }
    ];

    // Run tests
    for (const testCase of testCases) {
      if (testCase.skipInSandbox && this.isSandboxMode()) {
        console.log(`⏭️  Skipping: ${testCase.name} (sandbox mode)`);
        continue;
      }

      await this.runTest(testCase);
    }

    // Print results
    this.printResults();
  }

  private async checkConfiguration() {
    console.log('📋 Configuration Check:');
    console.log('======================');

    const config = {
      'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      'AWS_REGION': process.env.AWS_REGION || '❌ Missing',
      'SES_FROM_EMAIL': process.env.SES_FROM_EMAIL || '❌ Missing',
      'Test Email': this.testEmail
    };

    Object.entries(config).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

    console.log('\n');

    // Check if all required vars are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('❌ AWS credentials not configured!');
      console.log('\nPlease set the following environment variables:');
      console.log('- AWS_ACCESS_KEY_ID');
      console.log('- AWS_SECRET_ACCESS_KEY');
      console.log('- AWS_REGION');
      console.log('- SES_FROM_EMAIL\n');
      process.exit(1);
    }
  }

  private async runTest(testCase: TestCase) {
    process.stdout.write(`🧪 ${testCase.name}... `);

    try {
      const startTime = Date.now();
      await testCase.test();
      const duration = Date.now() - startTime;

      console.log(`✅ PASS (${duration}ms)`);
      this.results.push({ name: testCase.name, passed: true });
    } catch (error) {
      console.log('❌ FAIL');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   Error: ${errorMessage}`);
      
      this.results.push({ 
        name: testCase.name, 
        passed: false, 
        error: errorMessage 
      });

      // Provide troubleshooting tips
      this.provideTroubleshootingTips(errorMessage);
    }
  }

  private provideTroubleshootingTips(error: string) {
    console.log('\n   💡 Troubleshooting:');

    if (error.includes('MessageRejected') || error.includes('not verified')) {
      console.log('   - Verify sender email in AWS SES console');
      console.log('   - In sandbox mode, verify recipient email too');
      console.log('   - Check: https://console.aws.amazon.com/ses/home#verified-senders');
    } else if (error.includes('InvalidParameterValue')) {
      console.log('   - Check email format and content');
      console.log('   - Ensure no invalid characters in subject/body');
    } else if (error.includes('AccessDenied')) {
      console.log('   - Check IAM permissions for SES');
      console.log('   - User needs AmazonSESFullAccess or ses:SendEmail permission');
    } else if (error.includes('Region')) {
      console.log('   - Verify AWS_REGION matches your SES configuration');
      console.log('   - SES is not available in all regions');
    } else if (error.includes('Rate exceeded')) {
      console.log('   - Check SES sending limits in console');
      console.log('   - Implement rate limiting in production');
    }

    console.log();
  }

  private isSandboxMode(): boolean {
    // In production, you might want to check this via API
    return true; // Assume sandbox for safety
  }

  private printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('======================');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`   • ${result.name}: ${result.error}`);
        });
    }

    console.log('\n🎯 Next Steps:');
    if (passed === this.results.length) {
      console.log('✅ All tests passed! Your email service is configured correctly.');
      console.log('   1. Request production access in AWS SES');
      console.log('   2. Verify your domain for better deliverability');
      console.log('   3. Set up bounce and complaint handling');
    } else {
      console.log('⚠️  Some tests failed. Please:');
      console.log('   1. Check AWS SES console for verified emails');
      console.log('   2. Verify your AWS credentials are correct');
      console.log('   3. Ensure your region supports SES');
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const testEmail = args[0];

  if (args.includes('--help') || args.includes('-h')) {
    console.log('InmoTech Email Service Tester');
    console.log('============================\n');
    console.log('Usage: npm run test:email [test-email]');
    console.log('\nExamples:');
    console.log('  npm run test:email');
    console.log('  npm run test:email your-email@example.com');
    console.log('\nNote: Email must be verified in AWS SES console');
    return;
  }

  const tester = new EmailServiceTester(testEmail);
  await tester.runTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

export { EmailServiceTester };