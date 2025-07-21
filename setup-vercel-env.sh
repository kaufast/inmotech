#!/bin/bash

# InmoTech Vercel Environment Setup Script
echo "🚀 Setting up Vercel environment variables..."

# Load environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# Function to add environment variable to Vercel
add_env_var() {
    local var_name=$1
    local var_value=$2
    local env_name=$3
    
    if [ -n "$var_value" ]; then
        echo "Adding $var_name..."
        echo "$var_value" | vercel env add "$env_name" production --force
    else
        echo "⚠️  Skipping $var_name (not set)"
    fi
}

# Add all environment variables
add_env_var "DATABASE_URL" "$DATABASE_URL" "database_url"
add_env_var "DATABASE_URL" "$DATABASE_URL" "direct_url"
add_env_var "JWT_SECRET" "$JWT_SECRET" "jwt_secret"
add_env_var "REFRESH_JWT_SECRET" "$REFRESH_JWT_SECRET" "refresh_jwt_secret"
add_env_var "NEXT_PUBLIC_BASE_URL" "https://inmotech.vercel.app" "next_public_base_url"
add_env_var "OPENPAY_MERCHANT_ID" "$OPENPAY_MERCHANT_ID" "openpay_merchant_id"
add_env_var "OPENPAY_PRIVATE_KEY" "$OPENPAY_PRIVATE_KEY" "openpay_private_key"
add_env_var "OPENPAY_PUBLIC_KEY" "$OPENPAY_PUBLIC_KEY" "openpay_public_key"
add_env_var "OPENPAY_PRODUCTION" "$OPENPAY_PRODUCTION" "openpay_production"
add_env_var "DIDIT_CLIENT_ID" "$DIDIT_CLIENT_ID" "didit_client_id"
add_env_var "DIDIT_CLIENT_SECRET" "$DIDIT_CLIENT_SECRET" "didit_client_secret"
add_env_var "DIDIT_API_KEY" "$DIDIT_API_KEY" "didit_api_key"
add_env_var "LEMONWAY_AUTHORIZATION" "$LEMONWAY_AUTHORIZATION" "lemonway_authorization"
add_env_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "aws_access_key_id"
add_env_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" "aws_secret_access_key"
add_env_var "AWS_REGION" "$AWS_REGION" "aws_region"
add_env_var "SES_FROM_EMAIL" "$SES_FROM_EMAIL" "ses_from_email"

echo "✅ Vercel environment setup completed!"
echo "🚀 Now run: vercel --prod"