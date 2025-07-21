// Next.js API route (Pages Router - known to work)
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { email, password } = req.body;

    // Simple test credentials
    if (email === 'test@example.com' && password === 'test123') {
      return res.status(200).json({
        success: true,
        message: 'Login successful (Pages Router)',
        user: {
          id: 'test-user',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        },
        token: 'test-token-123'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Working login endpoint ready (Pages Router)',
      methods: ['POST'],
      test: 'This endpoint actually works!'
    });
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
  res.status(405).json({ message: 'Method not allowed' });
}