import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'success',
    method: 'GET',
    message: 'Minimal GET endpoint works'
  });
}

export async function POST() {
  return NextResponse.json({ 
    status: 'success',
    method: 'POST',
    message: 'Minimal POST endpoint works'
  });
}