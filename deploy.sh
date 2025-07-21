#!/bin/bash

# Quick deploy script for InmoTech

echo "🚀 Deploying InmoTech to Vercel..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

# Build and deploy
echo "Starting deployment..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Run database migrations: npm run db:migrate"
echo "3. Initialize RBAC: npm run seed:rbac"
echo ""
echo "View deployment: https://inmotech.vercel.app"