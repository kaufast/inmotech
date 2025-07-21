import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Simple test credentials
    if (email === 'test@example.com' && password === 'test123') {
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'test-user',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        },
        token: 'test-token-123'
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Simple login endpoint ready',
    methods: ['POST']
  });
}