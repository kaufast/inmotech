// Ultra-minimal endpoint with zero dependencies
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { email, password } = req.body || {};

    // Test credentials
    if (email === 'test@example.com' && password === 'test123') {
      return res.status(200).json({
        success: true,
        message: 'Login successful!',
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

  return res.status(200).json({
    message: 'Ultra simple endpoint - zero dependencies',
    working: true
  });
}