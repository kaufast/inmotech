import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt-rbac-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/user/properties - Get current user's properties
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    const where: any = {
      OR: [
        { ownerId: user.userId },
        { agentId: user.userId } // If user is assigned as agent
      ]
    };
    
    if (status) where.status = status;
    if (!includeInactive) where.status = { not: 'INACTIVE' };
    
    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            inquiries_list: true,
            viewings: true,
            watchlistedBy: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ properties });
    
  } catch (error) {
    console.error('Error fetching user properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// GET /api/user/properties/stats - Get user's property statistics
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const { endpoint } = await request.json();
    
    if (endpoint === 'stats') {
      const stats = await prisma.property.aggregate({
        where: {
          OR: [
            { ownerId: user.userId },
            { agentId: user.userId }
          ]
        },
        _count: {
          id: true
        }
      });
      
      const statusStats = await prisma.property.groupBy({
        by: ['status'],
        where: {
          OR: [
            { ownerId: user.userId },
            { agentId: user.userId }
          ]
        },
        _count: {
          status: true
        }
      });
      
      const inquiryStats = await prisma.propertyInquiry.count({
        where: {
          property: {
            OR: [
              { ownerId: user.userId },
              { agentId: user.userId }
            ]
          }
        }
      });
      
      const viewingStats = await prisma.propertyViewing.count({
        where: {
          property: {
            OR: [
              { ownerId: user.userId },
              { agentId: user.userId }
            ]
          }
        }
      });
      
      return NextResponse.json({
        totalProperties: stats._count.id,
        statusBreakdown: statusStats,
        totalInquiries: inquiryStats,
        totalViewings: viewingStats
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid endpoint' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error fetching user property stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});