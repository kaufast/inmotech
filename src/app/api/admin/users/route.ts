import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/jwt-rbac-middleware';

const prisma = new PrismaClient();

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'unverified') {
      where.isVerified = false;
    } else if (status === 'admin') {
      where.isAdmin = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sort]: order },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isVerified: true,
          isAdmin: true,
          isActive: true,
          twoFactorEnabled: true,
          lastLogin: true,
          loginAttempts: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              userSessions: true,
              investments: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

export const PATCH = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate allowed updates
    const allowedUpdates = ['isAdmin', 'isActive', 'isVerified'];
    const filteredUpdates: any = {};

    for (const key of allowedUpdates) {
      if (key in updates && typeof updates[key] === 'boolean') {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: filteredUpdates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        isAdmin: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLogin: true,
        loginAttempts: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Admin user update error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});