import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('Simple auth endpoint called');
    
    const body = await request.json();
    const { email, password } = body;

    console.log('Received:', { email: email ? 'present' : 'missing', password: password ? 'present' : 'missing' });

    // Simple validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // For testing - accept test credentials
    if (email === 'test@example.com' && password === 'test123') {
      return NextResponse.json({
        message: 'Login successful',
        user: {
          id: 'test-user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isVerified: true,
          isAdmin: false
        },
        token: 'test-jwt-token-123'
      });
    }

    // Default rejection
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Simple auth error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}