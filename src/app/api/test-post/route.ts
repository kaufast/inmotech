import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ method: 'GET', message: 'Test endpoint working' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ 
    method: 'POST', 
    message: 'Test POST working',
    body: body 
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}