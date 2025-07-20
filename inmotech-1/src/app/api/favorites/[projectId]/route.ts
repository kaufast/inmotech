import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ==================== GET /api/favorites/[projectId] ====================

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const userId = request.headers.get('user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if project is favorited by user
    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      },
      select: {
        id: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      isFavorited: !!favorite,
      favoriteDate: favorite?.createdAt || null,
      projectId
    });

  } catch (error) {
    console.error('Check favorite status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== DELETE /api/favorites/[projectId] ====================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const userId = request.headers.get('user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Find and delete the favorite
    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      },
      include: {
        project: {
          select: { title: true }
        }
      }
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Project is not in your favorites' },
        { status: 404 }
      );
    }

    // Delete the favorite
    await prisma.userFavorite.delete({
      where: { id: favorite.id }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PROJECT_UNFAVORITED',
        resource: 'PROJECT',
        resourceId: projectId,
        details: JSON.stringify({
          projectTitle: favorite.project.title,
          action: 'removed_via_delete'
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Project removed from favorites'
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}