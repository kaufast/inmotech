import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
// Try different import approach for Vercel Edge Runtime
import { compare, hash as bcryptHash } from 'bcrypt-ts';

// Verify password against bcrypt hash (for existing users)
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For bcrypt hashes (start with $2a$ or $2b$), use bcrypt-ts
  if (hash && hash.startsWith('$2')) {
    console.log('Bcrypt hash detected - using bcrypt-ts verification');
    
    try {
      // Use bcrypt-ts browser version for Edge Runtime compatibility
      const isMatch = await compare(password, hash);
      console.log(`Bcrypt verification result: ${isMatch}`);
      return isMatch;
    } catch (error) {
      console.error('Bcrypt verification error:', error);
      
      // Security: Never fallback to accepting passwords on error
      // This prevents bypassing authentication if bcrypt fails
      return false;
    }
  }
  
  // For new passwords, use PBKDF2
  const [salt, storedHash] = hash.split(':');
  if (!salt || !storedHash) return false;
  
  const derivedKey = pbkdf2(sha256, password, salt, { c: 100000, dkLen: 32 });
  const derivedHash = bytesToHex(derivedKey);
  
  return derivedHash === storedHash;
}

// Hash password for new users (Edge-compatible with bcrypt)
export async function hashPassword(password: string): Promise<string> {
  try {
    // Use bcrypt-ts for consistency with existing hashes
    const saltRounds = 12; // Same as our database users
    return await bcryptHash(password, saltRounds);
  } catch (error) {
    console.error('Bcrypt hashing error, falling back to PBKDF2:', error);
    
    // Fallback to PBKDF2 if bcrypt fails
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const saltHex = bytesToHex(salt);
    
    const derivedKey = pbkdf2(sha256, password, saltHex, { c: 100000, dkLen: 32 });
    const hash = bytesToHex(derivedKey);
    
    return `${saltHex}:${hash}`;
  }
}

// Generate secure random token
export function generateSecureToken(): string {
  const buffer = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(buffer);
}