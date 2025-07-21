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

async function resetPassword() {
  try {
    const email = 'kennethmelchor@gmail.com';
    const newPassword = 'password123';
    
    console.log(`🔐 Resetting password for ${email}...`);
    
    const sql = neon(DATABASE_URL);

    // Check if user exists
    const user = await sql`
      SELECT id, email
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;

    if (user.length === 0) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user[0].email}`);

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log(`🔐 New password hash: ${hashedPassword}`);

    // Update the password
    console.log('💾 Updating password in database...');
    const result = await sql`
      UPDATE users 
      SET password_hash = ${hashedPassword}, 
          login_attempts = 0,
          locked_until = null
      WHERE email = ${email}
    `;

    console.log(`✅ Password updated successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New password: ${newPassword}`);

    // Verify the new password works
    console.log('\n🧪 Verifying new password...');
    const updatedUser = await sql`
      SELECT password_hash
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;

    const isMatch = await bcrypt.compare(newPassword, updatedUser[0].password_hash);
    if (isMatch) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetPassword().then(() => {
  console.log('\n✅ Password reset completed');
  process.exit(0);
});