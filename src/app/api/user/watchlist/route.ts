import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

// GET /api/user/watchlist - Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const [watchlist, total] = await Promise.all([
      prisma.userWatchlist.findMany({
        where: { userId: authResult.userId! },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              location: true,
              targetAmount: true,
              currency: true,
              expectedReturn: true,
              duration: true,
              riskLevel: true,
              propertyType: true,
              minimumInvestment: true,
              images: true,
              status: true,
              createdAt: true,
            }
          }
        },
        orderBy: { addedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userWatchlist.count({
        where: { userId: authResult.userId! }
      })
    ]);

    return NextResponse.json({
      watchlist: watchlist.map(item => ({
        id: item.id,
        addedAt: item.addedAt,
        project: item.project
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Watchlist fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST /api/user/watchlist - Add project to watchlist
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if project exists and is active
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if already in watchlist
    const existingWatchlist = await prisma.userWatchlist.findUnique({
      where: {
        userId_projectId: {
          userId: authResult.userId!,
          projectId: projectId
        }
      }
    });

    if (existingWatchlist) {
      return NextResponse.json(
        { error: 'Project already in watchlist' },
        { status: 400 }
      );
    }

    // Add to watchlist
    const watchlistItem = await prisma.userWatchlist.create({
      data: {
        userId: authResult.userId!,
        projectId: projectId
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            location: true,
            expectedReturn: true,
            minimumInvestment: true,
            currency: true,
            images: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      watchlistItem
    }, { status: 201 });

  } catch (error) {
    console.error('Add to watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/watchlist - Remove project from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if item exists in watchlist
    const watchlistItem = await prisma.userWatchlist.findUnique({
      where: {
        userId_projectId: {
          userId: authResult.userId!,
          projectId: projectId
        }
      }
    });

    if (!watchlistItem) {
      return NextResponse.json(
        { error: 'Project not in watchlist' },
        { status: 404 }
      );
    }

    // Remove from watchlist
    await prisma.userWatchlist.delete({
      where: {
        userId_projectId: {
          userId: authResult.userId!,
          projectId: projectId
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Project removed from watchlist'
    });

  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}