const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { join } = require('path');

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function checkPasswords() {
  try {
    console.log('🔍 Connecting to database...');
    const sql = neon(DATABASE_URL);

    // Get the password hash for kennethmelchor@gmail.com
    const user = await sql`
      SELECT password_hash
      FROM users 
      WHERE email = 'kennethmelchor@gmail.com'
      LIMIT 1
    `;

    if (user.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const passwordHash = user[0].password_hash;
    console.log(`🔐 Password hash: ${passwordHash}`);

    // Test common passwords
    const testPasswords = [
      'password123',
      'Password123',
      'PASSWORD123',
      'password',
      'Password',
      'PASSWORD',
      '12345678',
      'kenneth123',
      'Kenneth123',
      'KENNETH123',
      'melchor123',
      'Melchor123',
      'MELCHOR123',
      'kennethmelchor',
      'KennethMelchor',
      'KENNETHMELCHOR',
      'admin123',
      'Admin123',
      'ADMIN123',
      'test123',
      'Test123',
      'TEST123'
    ];

    console.log('\n🧪 Testing passwords...');
    
    for (const testPassword of testPasswords) {
      try {
        const isMatch = await bcrypt.compare(testPassword, passwordHash);
        if (isMatch) {
          console.log(`✅ MATCH FOUND! Password: "${testPassword}"`);
          return;
        } else {
          console.log(`❌ No match: "${testPassword}"`);
        }
      } catch (error) {
        console.log(`❌ Error testing "${testPassword}": ${error.message}`);
      }
    }

    console.log('\n❌ No matching password found in test list');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPasswords().then(() => {
  console.log('\n✅ Password check completed');
  process.exit(0);
});