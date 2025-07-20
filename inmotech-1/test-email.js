/**
 * Email Test Script
 * Send a test email to kennethmelchor@gmail.com
 */

import { sendWelcomeEmail, sendPlainEmail } from './src/lib/sesClient.js';

async function sendTestEmail() {
  console.log('🧪 Testing InmoTech Email System');
  console.log('================================');
  
  const testEmail = 'kennethmelchor@gmail.com';
  const firstName = 'Kenneth';
  
  try {
    console.log(`📧 Sending welcome email to: ${testEmail}`);
    
    // Option 1: Send welcome email with full InmoTech branding
    const welcomeResult = await sendWelcomeEmail(
      testEmail,
      firstName,
      'https://inmotech.com/verify-email?token=test123&email=kennethmelchor@gmail.com'
    );
    
    if (welcomeResult.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log(`📨 Message ID: ${welcomeResult.messageId}`);
    } else {
      console.log('❌ Welcome email failed:', welcomeResult.error);
      
      // Fallback: Send a simple test email
      console.log('🔄 Trying simple test email...');
      
      const simpleTestResult = await sendPlainEmail(
        testEmail,
        '🧪 InmoTech Email Test',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ED4F01;">🏠 InmoTech Email Test</h2>
            <p>Hello Kenneth!</p>
            <p>This is a test email from your <strong>InmoTech Real Estate Crowdfunding Platform</strong>.</p>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>✅ Email System Status:</h3>
              <ul>
                <li>📧 SES Client: <strong>Active</strong></li>
                <li>🎨 HTML Templates: <strong>Working</strong></li>
                <li>🔐 Authentication: <strong>Configured</strong></li>
                <li>🚀 Platform: <strong>Ready</strong></li>
              </ul>
            </div>
            
            <p>Your real estate investment platform is ready to send:</p>
            <ul>
              <li>Welcome emails for new users</li>
              <li>Password reset notifications</li>
              <li>Investment confirmations</li>
              <li>KYC approval messages</li>
              <li>Project updates</li>
            </ul>
            
            <p style="margin-top: 30px;">
              <strong>Next steps:</strong><br>
              Visit your platform at <a href="http://localhost:3001" style="color: #ED4F01;">http://localhost:3001</a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is a test email from InmoTech Real Estate Crowdfunding Platform<br>
              Generated on ${new Date().toLocaleString('es-ES')}
            </p>
          </div>
        `
      );
      
      if (simpleTestResult.success) {
        console.log('✅ Simple test email sent successfully!');
        console.log(`📨 Message ID: ${simpleTestResult.messageId}`);
      } else {
        console.log('❌ Simple test email also failed:', simpleTestResult.error);
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    
    // Show configuration help
    console.log('\n🔧 Configuration Check:');
    console.log('=======================');
    console.log('AWS_REGION:', process.env.AWS_REGION || '❌ Not set');
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set');
    console.log('SES_SENDER_EMAIL:', process.env.SES_SENDER_EMAIL || '❌ Not set');
    
    console.log('\n📋 To configure AWS SES:');
    console.log('1. Set up AWS SES in your AWS console');
    console.log('2. Verify your sender email domain');
    console.log('3. Add AWS credentials to your .env.local file');
    console.log('4. Run: npm run test-email');
  }
}

// Run the test
sendTestEmail();