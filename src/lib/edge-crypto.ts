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

// JWT Functions using Web Crypto API for Edge Runtime
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production';

// Base64 URL encode (JWT spec requires URL-safe base64)
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Base64 URL decode
function base64UrlDecode(str: string): string {
  // Add padding if needed
  str += '='.repeat((4 - str.length % 4) % 4);
  // Replace URL-safe chars back
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(str);
}

// Create HMAC-SHA256 signature using Web Crypto API
async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  // Convert ArrayBuffer to base64url
  const bytes = new Uint8Array(signature);
  const binary = String.fromCharCode(...bytes);
  return base64UrlEncode(binary);
}

// Verify HMAC-SHA256 signature
async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const expectedSignature = await createHmacSignature(data, secret);
    return expectedSignature === signature;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

// Create a secure JWT with proper HMAC-SHA256 signature
export async function createSecureJWT(payload: any, expiresIn: string = '7d'): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  let exp: number;
  
  // Parse expiration time
  if (expiresIn === '7d') {
    exp = now + (7 * 24 * 60 * 60); // 7 days
  } else if (expiresIn === '30d') {
    exp = now + (30 * 24 * 60 * 60); // 30 days
  } else if (expiresIn === '1h') {
    exp = now + (60 * 60); // 1 hour
  } else {
    exp = now + (7 * 24 * 60 * 60); // Default 7 days
  }
  
  const fullPayload = {
    ...payload,
    iat: now,
    exp
  };
  
  // Create header and payload strings
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const headerPayload = `${headerB64}.${payloadB64}`;
  
  // Create HMAC-SHA256 signature
  const signature = await createHmacSignature(headerPayload, JWT_SECRET);
  
  return `${headerPayload}.${signature}`;
}

// Verify and decode a JWT
export async function verifySecureJWT(token: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const [headerB64, payloadB64, signature] = parts;
    const headerPayload = `${headerB64}.${payloadB64}`;
    
    // Verify signature
    const isValid = await verifyHmacSignature(headerPayload, signature, JWT_SECRET);
    if (!isValid) {
      throw new Error('Invalid JWT signature');
    }
    
    // Decode payload
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('JWT expired');
    }
    
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    throw error;
  }
}