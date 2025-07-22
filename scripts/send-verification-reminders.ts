#!/usr/bin/env ts-node

/**
 * Email Verification Reminder Cron Job
 * 
 * This script should be run periodically (e.g., daily) to send reminder emails
 * to users who haven't verified their email addresses.
 * 
 * Usage:
 *   npx ts-node scripts/send-verification-reminders.ts
 * 
 * Environment Variables Required:
 *   - NEXTAUTH_URL or NEXT_PUBLIC_BASE_URL: Base URL for the application
 *   - INTERNAL_API_SECRET: Secret for internal API calls
 *   - All email service environment variables (AWS SES)
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function sendVerificationReminders() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (!internalSecret) {
    console.error('❌ INTERNAL_API_SECRET environment variable is required');
    process.exit(1);
  }

  console.log('🚀 Starting verification reminder job...');
  console.log('📡 Base URL:', baseUrl);

  try {
    const response = await fetch(`${baseUrl}/api/auth/send-verification-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${internalSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API call failed with status ${response.status}:`, errorText);
      process.exit(1);
    }

    const result = await response.json();
    
    console.log('✅ Verification reminders completed successfully');
    console.log(`📧 Emails sent: ${result.emailsSent}`);
    console.log(`🧹 Expired tokens cleaned up: ${result.expiredTokensCleanedUp}`);
    
    if (result.emailsSent === 0 && result.expiredTokensCleanedUp === 0) {
      console.log('ℹ️  No action needed - all users are verified or no expired tokens');
    }

  } catch (error) {
    console.error('❌ Error running verification reminders:', error);
    process.exit(1);
  }
}

// Run the job
if (require.main === module) {
  sendVerificationReminders()
    .then(() => {
      console.log('🏁 Job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Job failed:', error);
      process.exit(1);
    });
}