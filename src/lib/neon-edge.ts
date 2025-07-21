import { neon } from '@neondatabase/serverless';

// Get database URL from environment with fallback
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment');
}

// Create Neon client for Edge Runtime
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

// Create a function to get SQL client with error handling
export function getSql() {
  if (!sql) {
    throw new Error('Database connection not initialized');
  }
  return sql;
}

// Helper function to get user by email
export async function getUserByEmail(email: string) {
  const db = getSql();
  const result = await db`
    SELECT 
      id, 
      email, 
      password_hash as password,
      first_name as "firstName",
      last_name as "lastName",
      is_active as "isActive",
      is_verified as "isVerified",
      is_admin as "isAdmin",
      kyc_status as "kycStatus"
    FROM users 
    WHERE email = ${email.toLowerCase()}
    LIMIT 1
  `;
  
  return result[0] || null;
}

// Helper function to create refresh token
export async function createRefreshToken(userId: string, token: string, expiresAt: Date) {
  const db = getSql();
  await db`
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `;
}

// Helper function to update last login
export async function updateLastLogin(userId: string) {
  const db = getSql();
  await db`
    UPDATE users 
    SET last_login = ${new Date()}
    WHERE id = ${userId}
  `;
}