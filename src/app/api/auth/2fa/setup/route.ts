import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifySecureJWT } from '@/lib/edge-crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Use Node.js runtime for TOTP and QR code generation
// export const runtime = 'edge';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    
    // Verify JWT token
    let payload;
    try {
      payload = await verifySecureJWT(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        twoFactorEnabled: true,
        twoFactorSecret: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled for this account' },
        { status: 400 }
      );
    }

    // Generate a new secret
    const secret = authenticator.generateSecret();
    
    // Create TOTP URI for QR code
    const serviceName = 'InmoTech';
    const accountName = user.email;
    const otpUri = authenticator.keyuri(accountName, serviceName, secret);
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(otpUri);
    
    // Save the secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret
      }
    });

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      secret: secret,
      manualEntryKey: secret.match(/.{1,4}/g)?.join(' ') || secret,
      backupCodes: [] // Will be generated after verification
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}