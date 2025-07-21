# AWS SES Setup Guide for InmoTech

## 🔧 Prerequisites

1. AWS Account
2. AWS CLI installed (optional but recommended)
3. Domain for sending emails (optional - can use AWS SES sandbox)

## 📋 Step-by-Step AWS SES Configuration

### Step 1: Create AWS Account & Access Keys

1. **Go to AWS Console**: https://console.aws.amazon.com
2. **Navigate to IAM**:
   - Search for "IAM" in the services
   - Go to Users → Add User
   - Username: `inmotech-ses-user`
   - Access type: Programmatic access

3. **Set Permissions**:
   - Attach existing policies
   - Search and select: `AmazonSESFullAccess`
   - Create user

4. **Save Credentials**:
   ```env
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   ```

### Step 2: Configure SES Service

1. **Navigate to SES Console**: https://console.aws.amazon.com/ses
2. **Select Region** (important!):
   - Choose region close to users
   - Common choices: `eu-west-1` (Ireland), `us-east-1` (Virginia)
   - Note: SES is not available in all regions

3. **Verify Email Address** (for testing):
   - Go to "Verified identities"
   - Click "Create identity"
   - Choose "Email address"
   - Enter: `noreply@yourdomain.com`
   - Check email and click verification link

4. **Verify Domain** (for production):
   - Go to "Verified identities"
   - Click "Create identity"
   - Choose "Domain"
   - Enter your domain: `yourdomain.com`
   - Add the DNS records shown to your domain provider

### Step 3: Request Production Access

By default, SES is in sandbox mode (can only send to verified emails).

1. **Go to**: Account dashboard → Request production access
2. **Fill form**:
   - Use case: Transactional emails
   - Website URL: Your Vercel deployment URL
   - Description: "Real estate investment platform sending transactional emails"
   - Expected volume: Start with 1000/day
3. **Wait**: Usually approved within 24 hours

### Step 4: Environment Variables

Add to your `.env.local` and Vercel:

```env
# AWS SES Configuration
AWS_ACCESS_KEY_ID=AKIA1234567890EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-west-1
SES_FROM_EMAIL=noreply@inmotech.com
```

### Step 5: Email Templates (Optional)

Create SES email templates for better performance:

```bash
# Install AWS CLI first
brew install awscli  # macOS
# or
sudo apt-get install awscli  # Ubuntu

# Configure AWS CLI
aws configure

# Create welcome email template
aws ses put-template --template file://ses-templates/welcome.json

# Create investment confirmation template
aws ses put-template --template file://ses-templates/investment-confirmed.json
```

## 📧 Email Template Files

### ses-templates/welcome.json
```json
{
  "TemplateName": "WelcomeEmail",
  "SubjectPart": "Welcome to InmoTech - Verify Your Email",
  "HtmlPart": "<html><body><h1>Welcome {{firstName}}!</h1><p>Please verify your email: <a href='{{verificationUrl}}'>Verify Email</a></p></body></html>",
  "TextPart": "Welcome {{firstName}}! Please verify your email: {{verificationUrl}}"
}
```

### ses-templates/investment-confirmed.json
```json
{
  "TemplateName": "InvestmentConfirmed",
  "SubjectPart": "Investment Confirmed - {{projectTitle}}",
  "HtmlPart": "<html><body><h1>Investment Confirmed!</h1><p>Hi {{firstName}},</p><p>Your investment of {{amount}} {{currency}} in {{projectTitle}} has been confirmed.</p><p>Transaction ID: {{transactionId}}</p></body></html>",
  "TextPart": "Investment Confirmed! Hi {{firstName}}, Your investment of {{amount}} {{currency}} in {{projectTitle}} has been confirmed. Transaction ID: {{transactionId}}"
}
```

## 🧪 Testing Email Service

### Test Script

Create `test-email.ts`:

```typescript
import { emailService } from '@/lib/email';

async function testEmailService() {
  try {
    console.log('Testing AWS SES Email Service...');
    
    // Test 1: Send test email
    await emailService.sendEmail(
      'test@example.com', // Replace with verified email
      'Test Email from InmoTech',
      '<h1>Test Email</h1><p>This is a test email from InmoTech platform.</p>',
      'Test Email\n\nThis is a test email from InmoTech platform.'
    );
    
    console.log('✅ Test email sent successfully');
    
    // Test 2: Send welcome email
    await emailService.sendWelcomeEmail(
      'test@example.com',
      'Test User',
      'test-verification-token'
    );
    
    console.log('✅ Welcome email sent successfully');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

// Run test
testEmailService();
```

### Manual Test via API

```bash
# Test email endpoint
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test email from InmoTech"
  }'
```

## 🔍 Troubleshooting

### Common Issues

1. **"Email address not verified"**:
   - Verify sender email in SES console
   - In sandbox mode, verify recipient too

2. **"Could not connect to SES"**:
   - Check AWS credentials
   - Verify region is correct
   - Check IAM permissions

3. **"Rate exceeded"**:
   - Check SES sending limits
   - Implement rate limiting in code

4. **Emails not arriving**:
   - Check spam folder
   - Verify domain SPF/DKIM records
   - Check SES suppression list

### Debug Mode

Add to your email service for debugging:

```typescript
// Add to email.ts
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Sending email:', {
    from: this.fromEmail,
    to,
    subject,
    region: process.env.AWS_REGION
  });
}
```

## 📊 Monitoring

### SES Console Metrics

1. Go to SES Console → Reputation dashboard
2. Monitor:
   - Bounce rate (keep < 5%)
   - Complaint rate (keep < 0.1%)
   - Send rate
   - Daily sending quota

### CloudWatch Alarms

Set up alarms for:
- High bounce rate
- High complaint rate
- Approaching send quota

## 🚀 Production Checklist

- [ ] AWS credentials configured
- [ ] SES region selected
- [ ] Sender email/domain verified
- [ ] Production access approved
- [ ] SPF records added
- [ ] DKIM enabled
- [ ] Email templates created
- [ ] Bounce handling configured
- [ ] Monitoring set up

## 📝 Email Types in InmoTech

1. **Transactional Emails**:
   - Welcome/Verification
   - Password Reset
   - Investment Confirmation
   - KYC Status Updates
   - Payment Receipts

2. **Notification Emails**:
   - New Projects
   - Investment Updates
   - Portfolio Alerts
   - Milestone Achieved

3. **Administrative Emails**:
   - Account Security
   - Policy Updates
   - System Maintenance

## 🔐 Security Best Practices

1. **Never commit AWS credentials**
2. **Use IAM roles with minimal permissions**
3. **Enable MFA on AWS account**
4. **Rotate access keys regularly**
5. **Monitor for unusual activity**
6. **Implement rate limiting**
7. **Validate email addresses before sending**

## 🌍 Regional Considerations

### For EU Users (GDPR):
- Use EU region (eu-west-1)
- Include unsubscribe links
- Store consent records

### For Mexico Users:
- Consider us-east-1 for lower latency
- Spanish language templates

### For US Users:
- Use us-east-1 or us-west-2
- CAN-SPAM compliance

## 💰 Cost Estimation

- **SES Pricing**: $0.10 per 1,000 emails
- **Monthly estimate** (10,000 emails): $1.00
- **Data transfer**: Usually negligible
- **No charge** for receiving emails

## 🎯 Next Steps

1. Complete AWS SES setup
2. Verify sender email/domain
3. Request production access
4. Test email sending
5. Monitor delivery rates
6. Set up bounce handling