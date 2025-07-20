import bcrypt from 'bcrypt';
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string): string => {
  if (!JWT_SECRET || JWT_SECRET === 'your-fallback-secret') {
    throw new Error('JWT_SECRET is not properly configured');
  }
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { userId: string } => {
  if (!JWT_SECRET || JWT_SECRET === 'your-fallback-secret') {
    throw new Error('JWT_SECRET is not properly configured');
  }
  return jwt.verify(token, JWT_SECRET) as { userId: string };
};