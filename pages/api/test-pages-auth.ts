// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  method: string;
  message: string;
  body?: any;
  success: boolean;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log('Pages API route called:', req.method);
  
  if (req.method === 'POST') {
    const { email, password } = req.body;
    
    if (email === 'test@example.com' && password === 'test123') {
      return res.status(200).json({ 
        method: 'POST',
        message: 'Login successful (Pages Router)',
        body: { email, password },
        success: true
      });
    }
    
    return res.status(401).json({ 
      method: 'POST',
      message: 'Invalid credentials',
      success: false
    });
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      method: 'GET',
      message: 'Test endpoint working (Pages Router)',
      success: true
    });
  }
  
  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ 
    method: req.method || 'UNKNOWN',
    message: 'Method not allowed',
    success: false
  });
}