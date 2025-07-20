import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Extract user ID from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        kycStatus: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        investmentLimit: true,
        totalInvested: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's investment summary
    const investmentSummary = await prisma.investment.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true,
    });

    // Get active sessions count
    const activeSessions = await prisma.session.count({
      where: { 
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    return NextResponse.json({
      user: {
        ...user,
        totalInvested: user.totalInvested.toNumber(),
        investmentLimit: user.investmentLimit?.toNumber() || 0,
        summary: {
          totalInvestments: investmentSummary._count,
          totalInvestedAmount: investmentSummary._sum.amount?.toNumber() || 0,
          activeSessions,
          availableInvestment: (user.investmentLimit?.toNumber() || 0) - user.totalInvested.toNumber(),
        }
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}