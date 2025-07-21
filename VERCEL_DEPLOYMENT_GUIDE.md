# Vercel Deployment Guide for InmoTech

This guide explains how to deploy the InmoTech platform with proper server-side authentication on Vercel.

## Prerequisites

1. Vercel account
2. PostgreSQL database (e.g., Neon, Supabase, or Railway)
3. Environment variables configured

## Environment Variables

Set the following environment variables in your Vercel project settings:

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Application
NODE_ENV="production"
```

### Optional Variables

```bash
# Email (AWS SES)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="eu-west-1"
EMAIL_FROM="noreply@inmotech.com"

# Payment Integration
OPENPAY_MERCHANT_ID="your-merchant-id"
OPENPAY_API_KEY="your-api-key"
OPENPAY_PUBLIC_KEY="your-public-key"
OPENPAY_PRODUCTION="true"

# KYC Integration
DIDIT_API_KEY="your-didit-api-key"
DIDIT_WEBHOOK_SECRET="your-webhook-secret"
```

## Deployment Steps

### 1. Prepare Your Database

Run the Prisma migrations to set up your database schema:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Using GitHub Integration

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### 3. Post-Deployment Steps

1. **Verify Deployment**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Create Admin User**
   ```bash
   npm run add-user -- --email admin@inmotech.com --password yourpassword --admin
   ```

3. **Seed RBAC Permissions**
   ```bash
   npm run seed:rbac
   ```

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset

### Protected Endpoints

All protected endpoints require the `Authorization: Bearer <token>` header.

- `GET /api/user/profile` - Get user profile
- `GET /api/projects` - List investment projects
- `POST /api/investments` - Create new investment

## Security Features

1. **Rate Limiting**
   - Login: 5 attempts per 15 minutes
   - API: 30 requests per minute
   - Strict endpoints: 10 requests per hour

2. **CORS Configuration**
   - Production: Restricted to your domain
   - Development: localhost:3000

3. **JWT Tokens**
   - Access token: 7 days expiry
   - Refresh token: 30 days expiry
   - Secure HTTP-only cookies in production

4. **Account Security**
   - Account lockout after 5 failed attempts
   - 30-minute lockout period
   - Password hashing with bcrypt

## Troubleshooting

### Database Connection Issues

1. Ensure `DATABASE_URL` includes `?sslmode=require` for production databases
2. Check if your database allows connections from Vercel's IP ranges
3. Verify connection pooling settings

### Authentication Issues

1. Verify `JWT_SECRET` is set correctly
2. Check CORS configuration matches your frontend URL
3. Ensure cookies are enabled for refresh tokens

### Build Errors

1. Run `npm run vercel-build` locally to test the build
2. Check for missing environment variables
3. Ensure all dependencies are in `package.json`

## Monitoring

1. **Health Check**
   - Monitor `/api/health` endpoint
   - Set up uptime monitoring (e.g., UptimeRobot)

2. **Error Tracking**
   - Use Vercel Analytics
   - Consider adding Sentry for error tracking

3. **Performance**
   - Monitor API response times
   - Check database query performance

## Best Practices

1. **Environment Variables**
   - Never commit secrets to git
   - Use strong, unique values for production
   - Rotate secrets regularly

2. **Database**
   - Use connection pooling
   - Implement proper indexes
   - Regular backups

3. **Security**
   - Keep dependencies updated
   - Regular security audits
   - Implement proper logging

## Support

For issues specific to this implementation:
1. Check the health endpoint for system status
2. Review Vercel function logs
3. Verify environment variables are set correctly