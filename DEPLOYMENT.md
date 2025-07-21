# InmoTech Vercel Deployment Guide

## 🚀 Quick Start

```bash
# Run the deployment script
./scripts/deploy-vercel.sh

# Or deploy manually
vercel
```

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Vercel CLI** installed (`npm i -g vercel`)
3. **Vercel account** (free tier works)
4. **Neon PostgreSQL database** configured
5. All environment variables ready

## 🔧 Environment Variables Setup

### 1. Database Configuration

Create a Neon database at https://neon.tech and get your connection strings:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host/database?sslmode=require"
```

### 2. Authentication Secrets

Generate strong secrets for JWT:

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
JWT_SECRET="your-generated-secret-here"
REFRESH_JWT_SECRET="different-generated-secret-here"
```

### 3. Payment Provider Credentials

From your .env.local file:

```env
OPENPAY_MERCHANT_ID="moiep6umtcnanql3jrxp"
OPENPAY_PRIVATE_KEY="sk_3433941e467c4875b178ce26348b0fac"
OPENPAY_PUBLIC_KEY="pk_3433941e467c4875b178ce26348b0fac"
OPENPAY_PRODUCTION="false"
LEMONWAY_AUTHORIZATION="54321"
```

### 4. Identity Verification

```env
DIDIT_CLIENT_ID="cAZsSyfcdX3IUOZlChrsjQ"
DIDIT_CLIENT_SECRET="DyBZga1hQhLI6MV2dhmq5fYsn25n4FP8JkmXN0-fOno"
DIDIT_API_KEY="your_didit_api_key"
```

### 5. Email Service (Optional)

```env
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="eu-west-1"
SES_FROM_EMAIL="noreply@inmotech.com"
```

### 6. Application URL

```env
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
```

## 📝 Step-by-Step Deployment

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Prepare Database

```bash
# Push schema to database
npm run db:migrate

# Seed RBAC system
npm run seed:rbac
```

### Step 4: Deploy to Vercel

#### Option A: Using Deployment Script

```bash
./scripts/deploy-vercel.sh
```

#### Option B: Manual Deployment

```bash
# Initial deployment
vercel

# Follow prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N
# - Project name: inmotech
# - Directory: ./ 
# - Override settings: N
```

### Step 5: Configure Environment Variables

#### Via Vercel CLI:

```bash
# Add each environment variable
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add REFRESH_JWT_SECRET production
# ... repeat for all variables
```

#### Via Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable for Production environment

### Step 6: Deploy to Production

```bash
# Deploy to production
vercel --prod
```

## 🔍 Post-Deployment Verification

### 1. Database Setup

After deployment, ensure database is initialized:

```bash
# Run migrations on production database
npm run db:migrate

# Initialize RBAC system
npm run seed:rbac
```

### 2. Test Authentication

```bash
# Test registration
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Test login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 3. Test API Endpoints

```bash
# Run API tests against production
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app npm run test:api
```

## 🛠️ Troubleshooting

### Build Fails

```bash
# Check build logs
vercel logs

# Test build locally
npm run build
```

### Database Connection Issues

1. Verify DATABASE_URL is correct
2. Check Neon dashboard for connection limits
3. Ensure SSL is enabled: `?sslmode=require`

### Environment Variables Not Working

1. Verify all variables are set in Vercel dashboard
2. Redeploy after adding variables:
   ```bash
   vercel --prod --force
   ```

### CORS Issues

The `vercel.json` includes CORS headers. If issues persist:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

## 🔄 Continuous Deployment

### GitHub Integration

1. Connect GitHub repo in Vercel dashboard
2. Enable automatic deployments
3. Set branch protection rules

### Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm test
      - run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 📊 Monitoring

### Enable Vercel Analytics

1. Go to project dashboard
2. Enable Analytics
3. Add to your app:
   ```bash
   npm install @vercel/analytics
   ```

### View Logs

```bash
# View function logs
vercel logs

# View build logs
vercel logs --type=build
```

### Set Up Alerts

1. Configure email alerts in Vercel dashboard
2. Set up uptime monitoring (e.g., UptimeRobot)
3. Monitor error rates

## 🔐 Security Checklist

- [ ] All secrets are strong and unique
- [ ] Database has connection limits
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Environment variables not exposed
- [ ] Error messages don't leak sensitive data
- [ ] HTTPS enforced (automatic on Vercel)

## 🚦 Production Checklist

### Before Going Live

- [ ] All tests passing
- [ ] RBAC system initialized
- [ ] Payment providers in production mode
- [ ] Email service configured
- [ ] Custom domain configured
- [ ] Analytics enabled
- [ ] Error tracking set up
- [ ] Backup strategy in place

### After Going Live

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify email delivery
- [ ] Test payment flow
- [ ] Monitor database performance
- [ ] Set up user feedback channel

## 🆘 Support

### Common Commands

```bash
# View deployment status
vercel ls

# View environment variables
vercel env ls

# Rollback deployment
vercel rollback

# View domains
vercel domains ls
```

### Getting Help

1. Check Vercel docs: https://vercel.com/docs
2. View logs: `vercel logs`
3. Check build output: `vercel inspect`
4. Contact support: https://vercel.com/support

## 🎉 Success!

Your InmoTech platform should now be live on Vercel. Visit your deployment URL to see it in action!

```
https://inmotech.vercel.app
```

Remember to:
1. Update NEXT_PUBLIC_BASE_URL with your actual URL
2. Configure custom domain if needed
3. Monitor initial user registrations
4. Check all integrations are working