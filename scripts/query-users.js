const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const { join } = require('path');

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function queryUsers() {
  try {
    console.log('🔍 Connecting to database...');
    const sql = neon(DATABASE_URL);

    // Get all users
    console.log('\n📋 All users in database:');
    const allUsers = await sql`
      SELECT 
        id,
        email,
        first_name as "firstName",
        last_name as "lastName", 
        is_active as "isActive",
        is_verified as "isVerified",
        is_admin as "isAdmin",
        created_at as "createdAt",
        last_login as "lastLogin"
      FROM users 
      ORDER BY created_at DESC
    `;

    if (allUsers.length === 0) {
      console.log('❌ No users found in database');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
        console.log(`   Active: ${user.isActive}, Verified: ${user.isVerified}, Admin: ${user.isAdmin}`);
        console.log(`   Created: ${user.createdAt}, Last Login: ${user.lastLogin}`);
        console.log('');
      });
    }

    // Check specifically for kennethmelchor@gmail.com
    console.log('🔍 Checking for kennethmelchor@gmail.com:');
    const specificUser = await sql`
      SELECT 
        id,
        email,
        password_hash,
        first_name as "firstName",
        last_name as "lastName",
        is_active as "isActive",
        is_verified as "isVerified", 
        is_admin as "isAdmin",
        kyc_status as "kycStatus",
        login_attempts as "loginAttempts",
        locked_until as "lockedUntil",
        created_at as "createdAt",
        last_login as "lastLogin"
      FROM users 
      WHERE email = 'kennethmelchor@gmail.com'
      LIMIT 1
    `;

    if (specificUser.length === 0) {
      console.log('❌ kennethmelchor@gmail.com not found in database');
    } else {
      const user = specificUser[0];
      console.log('✅ User found:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Verified: ${user.isVerified}`);
      console.log(`   Admin: ${user.isAdmin}`);
      console.log(`   KYC Status: ${user.kycStatus}`);
      console.log(`   Login Attempts: ${user.loginAttempts}`);
      console.log(`   Locked Until: ${user.lockedUntil}`);
      console.log(`   Password Hash: ${user.password_hash ? 'Present (' + user.password_hash.substring(0, 20) + '...)' : 'Missing'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLogin}`);
    }

  } catch (error) {
    console.error('❌ Error querying database:', error);
    process.exit(1);
  }
}

queryUsers().then(() => {
  console.log('\n✅ Query completed');
  process.exit(0);
});