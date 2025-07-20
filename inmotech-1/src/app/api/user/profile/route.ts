import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  dateOfBirth: z.string().datetime().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    // Extract user ID from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updates = updateProfileSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.dateOfBirth !== undefined) {
      updateData.dateOfBirth = new Date(updates.dateOfBirth);
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        updatedAt: true,
      }
    });

    // Log profile update
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATED',
        resource: 'USER',
        details: JSON.stringify({ 
          updatedFields: Object.keys(updateData),
          email: existingUser.email 
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({
      user: {
        ...updatedUser,
        totalInvested: updatedUser.totalInvested.toNumber(),
        investmentLimit: updatedUser.investmentLimit?.toNumber() || 0,
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user profile (public version)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    const currentUserId = request.headers.get('x-user-id');
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // If no target user ID specified, return current user's profile
    const userId = targetUserId || currentUserId;

    // Determine what data to return based on privacy settings
    const isOwnProfile = userId === currentUserId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        // Include sensitive data only for own profile
        ...(isOwnProfile && {
          email: true,
          phone: true,
          dateOfBirth: true,
          kycStatus: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          investmentLimit: true,
          totalInvested: true,
          lastLoginAt: true,
        })
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get investment summary for own profile
    let summary = null;
    if (isOwnProfile) {
      const investmentSummary = await prisma.investment.aggregate({
        where: { userId },
        _sum: { amount: true },
        _count: true,
      });

      summary = {
        totalInvestments: investmentSummary._count,
        totalInvestedAmount: investmentSummary._sum.amount?.toNumber() || 0,
      };
    }

    return NextResponse.json({
      user: {
        ...user,
        ...(user.totalInvested && { totalInvested: user.totalInvested.toNumber() }),
        ...(user.investmentLimit && { investmentLimit: user.investmentLimit.toNumber() }),
        ...(summary && { summary })
      },
      isOwnProfile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}