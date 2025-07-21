# InmoTech Vercel Deployment Checklist

## Pre-deployment

- [ ] All tests passing (`npm run test`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured in Vercel
- [ ] Database migrated and seeded
- [ ] API keys validated

## Environment Variables Required

### Database
- `DATABASE_URL` - Neon PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (for migrations)

### Authentication
- `JWT_SECRET` - Strong random string for JWT
- `REFRESH_JWT_SECRET` - Different strong random string

### Payment Providers
- `OPENPAY_MERCHANT_ID` - Your OpenPay merchant ID
- `OPENPAY_PRIVATE_KEY` - OpenPay private key
- `OPENPAY_PUBLIC_KEY` - OpenPay public key
- `OPENPAY_PRODUCTION` - "false" for testing
- `LEMONWAY_AUTHORIZATION` - Lemonway API key

### Identity Verification
- `DIDIT_CLIENT_ID` - DIDit OAuth client ID
- `DIDIT_CLIENT_SECRET` - DIDit OAuth secret
- `DIDIT_API_KEY` - DIDit API key

### Email Service (Optional)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., "eu-west-1")
- `SES_FROM_EMAIL` - Verified sender email

### Application
- `NEXT_PUBLIC_BASE_URL` - Your Vercel URL (e.g., https://your-app.vercel.app)

## Post-deployment

- [ ] Test authentication flow
- [ ] Verify RBAC permissions
- [ ] Test payment integration (sandbox)
- [ ] Check dashboard analytics
- [ ] Test watchlist functionality
- [ ] Verify email sending
- [ ] Run API tests against production

## Monitoring

- [ ] Set up Vercel Analytics
- [ ] Configure error reporting
- [ ] Set up uptime monitoring
- [ ] Enable Vercel logs
