#!/bin/bash

# InmoTech Vercel Deployment Script
# This script prepares and validates the project for Vercel deployment

echo "🚀 InmoTech Vercel Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print error and exit
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  Warning: $1${NC}"
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Step 1: Check prerequisites
echo -e "\n📋 Checking prerequisites..."

if ! command_exists node; then
    error_exit "Node.js is not installed. Please install Node.js 18+ first."
fi

if ! command_exists npm; then
    error_exit "npm is not installed. Please install npm first."
fi

if ! command_exists vercel; then
    warning "Vercel CLI is not installed. Installing now..."
    npm i -g vercel
fi

# Step 2: Check environment setup
echo -e "\n🔧 Checking environment setup..."

if [ ! -f ".env.local" ]; then
    warning ".env.local file not found. Make sure to set environment variables in Vercel dashboard."
else
    success ".env.local file found"
fi

# Step 3: Build validation
echo -e "\n🏗️  Running build validation..."

# Clean previous builds
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps || error_exit "Failed to install dependencies"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate || error_exit "Failed to generate Prisma client"

# Run type checking
echo "Running TypeScript check..."
npx tsc --noEmit || warning "TypeScript warnings detected"

# Test build locally
echo "Testing production build..."
npm run build || error_exit "Build failed. Please fix errors before deploying."

success "Build validation passed!"

# Step 4: Database preparation
echo -e "\n💾 Database preparation..."
echo "Make sure you have:"
echo "  1. Set up your Neon database"
echo "  2. Run 'npm run db:migrate' to sync schema"
echo "  3. Run 'npm run seed:rbac' to initialize roles"

# Step 5: Create deployment checklist
echo -e "\n📝 Creating deployment checklist..."

cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
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
EOF

success "Created DEPLOYMENT_CHECKLIST.md"

# Step 6: Deployment instructions
echo -e "\n📚 Deployment Instructions:"
echo "=========================="
echo ""
echo "1. First-time deployment:"
echo "   vercel"
echo ""
echo "2. Link to existing project:"
echo "   vercel link"
echo ""
echo "3. Set environment variables:"
echo "   vercel env add DATABASE_URL"
echo "   vercel env add JWT_SECRET"
echo "   (repeat for all variables)"
echo ""
echo "4. Deploy to production:"
echo "   vercel --prod"
echo ""
echo "5. After deployment, run database setup:"
echo "   npm run db:migrate"
echo "   npm run seed:rbac"
echo ""

# Step 7: Offer to deploy
echo -e "\n🎯 Ready to deploy!"
read -p "Would you like to deploy now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting Vercel deployment..."
    vercel
else
    echo "Deployment preparation complete. Run 'vercel' when ready to deploy."
fi

echo -e "\n✨ Deployment script completed!"