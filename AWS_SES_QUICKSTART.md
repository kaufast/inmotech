# AWS SES Quick Setup for InmoTech

## 🚀 5-Minute Setup

### 1. Create AWS Account
Go to https://aws.amazon.com and create a free account

### 2. Get AWS Credentials

```bash
# In AWS Console:
1. Go to IAM → Users → Add User
2. Username: inmotech-ses
3. Select: Programmatic access
4. Attach policy: AmazonSESFullAccess
5. Create user and save credentials
```

### 3. Configure SES

```bash
# In AWS Console:
1. Go to Amazon SES
2. Select region: eu-west-1 (Europe) or us-east-1 (US)
3. Verify email address:
   - Click "Create identity"
   - Choose "Email address"
   - Enter your email
   - Check inbox and click verification link
```

### 4. Set Environment Variables

Add to `.env.local`:

```env
# AWS SES Configuration
AWS_ACCESS_KEY_ID=AKIA1234567890EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-west-1
SES_FROM_EMAIL=noreply@yourdomain.com
```

### 5. Test Email Service

```bash
# Test locally
npm run test:email your-verified-email@example.com

# Test via API (start dev server first)
npm run dev

# In another terminal:
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "your-verified-email@example.com",
    "type": "simple"
  }'
```

## 📧 Email Templates Available

- `simple` - Basic test email
- `welcome` - User registration welcome email
- `reset` - Password reset email
- `investment` - Investment confirmation email

## 🔍 Common Issues

### "Email address not verified"
- Verify BOTH sender and recipient emails in SES console
- SES starts in sandbox mode - can only send to verified emails

### "Could not connect to the endpoint"
- Check AWS_REGION matches your SES setup
- Common regions: `eu-west-1`, `us-east-1`, `us-west-2`

### "Missing credentials"
- Ensure all 4 environment variables are set
- Restart dev server after adding variables

## 🚦 Production Checklist

1. **Request Production Access**:
   - In SES console → Account dashboard
   - Click "Request production access"
   - Fill form with use case

2. **Verify Domain** (recommended):
   - Add your domain instead of just email
   - Better deliverability
   - Professional appearance

3. **Set Up Monitoring**:
   - Enable CloudWatch metrics
   - Monitor bounce/complaint rates
   - Set up SNS notifications

## 💰 Costs

- First 62,000 emails/month: FREE
- After that: $0.10 per 1,000 emails
- Typical cost for 10K users: ~$1-5/month

## 🎯 Quick Commands

```bash
# Test email service
npm run test:email

# View AWS SES dashboard
open https://console.aws.amazon.com/ses

# Check email logs
vercel logs --type=function
```

## ✅ Success Indicators

1. Test email script shows all green checkmarks
2. You receive test emails in your inbox
3. No errors in console logs
4. Emails not going to spam

## 🆘 Need Help?

1. Check spam folder first
2. Verify emails in SES console
3. Check AWS credentials are correct
4. Ensure region matches SES setup
5. Review `AWS_SES_SETUP.md` for detailed guide