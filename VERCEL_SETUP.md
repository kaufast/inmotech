# Vercel Environment Variables Setup

You need to add these environment variables to Vercel manually. Run each command and paste the corresponding value when prompted:

## Required Environment Variables

### 1. Database
```bash
vercel env add database_url production
# Value: postgresql://neondb_owner:npg_m1zGSYrLNx5w@ep-orange-cake-ad7qt1rl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

vercel env add direct_url production  
# Value: postgresql://neondb_owner:npg_m1zGSYrLNx5w@ep-orange-cake-ad7qt1rl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. JWT Secrets
```bash
vercel env add jwt_secret production
# Value: dev-jwt-secret-key-change-in-production-12345

vercel env add refresh_jwt_secret production
# Value: dev-refresh-jwt-secret-key-change-in-production-67890
```

### 3. Base URL
```bash
vercel env add next_public_base_url production
# Value: https://inmotech.vercel.app
```

### 4. OpenPay (Mexico payments)
```bash
vercel env add openpay_merchant_id production
# Value: moiep6umtcnanql3jrxp

vercel env add openpay_private_key production
# Value: sk_3433941e467c4875b178ce26348b0fac

vercel env add openpay_production production
# Value: false
```

### 5. DIDit (KYC verification)
```bash
vercel env add didit_client_id production
# Value: cAZsSyfcdX3IUOZlChrsjQ

vercel env add didit_client_secret production
# Value: DyBZga1hQhLI6MV2dhmq5fYsn25n4FP8JkmXN0-fOno
```

### 6. Lemonway (EU payments)
```bash
vercel env add lemonway_authorization production
# Value: 54321
```

### 7. AWS SES (Email service)
```bash
vercel env add aws_access_key_id production
# Value: your-aws-access-key-id

vercel env add aws_secret_access_key production
# Value: your-aws-secret-access-key

vercel env add aws_region production
# Value: eu-west-3

vercel env add ses_from_email production
# Value: info@inmote.ch
```

## After Setting All Variables

Run the deployment:
```bash
vercel --prod
```

## Quick Setup Commands

Copy and run these commands one by one:

```bash
# Database
vercel env add database_url production

# JWT
vercel env add jwt_secret production
vercel env add refresh_jwt_secret production

# Base URL  
vercel env add next_public_base_url production

# OpenPay
vercel env add openpay_merchant_id production
vercel env add openpay_private_key production
vercel env add openpay_production production

# DIDit
vercel env add didit_client_id production
vercel env add didit_client_secret production

# Lemonway
vercel env add lemonway_authorization production

# AWS SES
vercel env add aws_access_key_id production
vercel env add aws_secret_access_key production
vercel env add aws_region production
vercel env add ses_from_email production
```