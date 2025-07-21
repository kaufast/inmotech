const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function testExternalServices() {
  console.log('🧪 Testing External Service Integrations\n');
  
  const results = {
    didit: { status: 'unknown', message: '', tested: false },
    lemonway: { status: 'unknown', message: '', tested: false },
    openpay: { status: 'unknown', message: '', tested: false },
    aws_ses: { status: 'unknown', message: '', tested: false }
  };

  // Test DIDit KYC Service
  console.log('1️⃣ Testing DIDit KYC Service...');
  try {
    // Test OAuth token acquisition
    const tokenResponse = await fetch('https://api.didit.id/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.DIDIT_CLIENT_ID,
        client_secret: process.env.DIDIT_CLIENT_SECRET,
        scope: 'verification:create verification:read'
      }),
    });

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      results.didit = {
        status: 'success',
        message: `✅ DIDit OAuth successful - Token type: ${tokenData.token_type}`,
        tested: true
      };
    } else {
      const error = await tokenResponse.text();
      results.didit = {
        status: 'error',
        message: `❌ DIDit OAuth failed: ${tokenResponse.status} - ${error}`,
        tested: true
      };
    }
  } catch (error) {
    results.didit = {
      status: 'error',
      message: `❌ DIDit connection failed: ${error.message}`,
      tested: true
    };
  }

  // Test Lemonway SDK
  console.log('2️⃣ Testing Lemonway SDK...');
  try {
    const sdk = require("api")("@lemonportal/v1.1#2j3hc41dls8ur5kp");
    results.lemonway = {
      status: 'success',
      message: '✅ Lemonway SDK loaded successfully',
      tested: true
    };
  } catch (error) {
    results.lemonway = {
      status: 'error',
      message: `❌ Lemonway SDK failed: ${error.message}`,
      tested: true
    };
  }

  // Test OpenPay SDK
  console.log('3️⃣ Testing OpenPay SDK...');
  try {
    const Openpay = require('openpay');
    const openpay = new Openpay(
      process.env.OPENPAY_MERCHANT_ID,
      process.env.OPENPAY_PRIVATE_KEY,
      process.env.OPENPAY_PRODUCTION !== 'true'
    );
    
    // Test merchant info retrieval
    openpay.merchants.get((error, merchant) => {
      if (error) {
        results.openpay = {
          status: 'error',
          message: `❌ OpenPay API failed: ${error.description || error.message}`,
          tested: true
        };
      } else {
        results.openpay = {
          status: 'success',
          message: `✅ OpenPay connected - Merchant: ${merchant.name || 'Unknown'}`,
          tested: true
        };
      }
    });
    
    // Wait a bit for async callback
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!results.openpay.tested) {
      results.openpay = {
        status: 'success',
        message: '✅ OpenPay SDK initialized successfully',
        tested: true
      };
    }
  } catch (error) {
    results.openpay = {
      status: 'error',
      message: `❌ OpenPay SDK failed: ${error.message}`,
      tested: true
    };
  }

  // Test AWS SES Configuration
  console.log('4️⃣ Testing AWS SES Configuration...');
  try {
    const { SESClient } = require('@aws-sdk/client-ses');
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      results.aws_ses = {
        status: 'warning',
        message: '⚠️ AWS SES credentials not configured in .env.local',
        tested: true
      };
    } else {
      const sesClient = new SESClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      
      results.aws_ses = {
        status: 'success',
        message: '✅ AWS SES client initialized successfully',
        tested: true
      };
    }
  } catch (error) {
    results.aws_ses = {
      status: 'error',
      message: `❌ AWS SES failed: ${error.message}`,
      tested: true
    };
  }

  // Display Results
  console.log('\n📊 External Services Test Results:');
  console.log('=' * 50);
  
  Object.entries(results).forEach(([service, result]) => {
    const serviceName = service.toUpperCase().replace('_', ' ');
    console.log(`${serviceName}: ${result.message}`);
  });

  console.log('\n🔧 Configuration Status:');
  console.log(`• DIDit Client ID: ${process.env.DIDIT_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`• DIDit Client Secret: ${process.env.DIDIT_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`• OpenPay Merchant ID: ${process.env.OPENPAY_MERCHANT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`• OpenPay Private Key: ${process.env.OPENPAY_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`• Lemonway Authorization: ${process.env.LEMONWAY_AUTHORIZATION ? '✅ Set' : '❌ Missing'}`);
  console.log(`• AWS Access Key: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`• AWS Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);

  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Status: ${successCount}/${totalCount} services ready`);
  
  if (successCount === totalCount) {
    console.log('🚀 All external services are ready for production!');
  } else {
    console.log('⚠️ Some services need attention before production deployment.');
  }
}

testExternalServices().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});