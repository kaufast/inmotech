import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// ==================== VALIDATION SCHEMAS ====================

const toggleFavoriteSchema = z.object({
  projectId: z.string().cuid('Invalid project ID')
});

const queryFavoritesSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10')
});

// ==================== GET /api/favorites ====================

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    const { page, limit } = queryFavoritesSchema.parse(params);

    // Get user's favorite projects with pagination
    const skip = (page - 1) * limit;
    
    const [favorites, totalCount] = await Promise.all([
      prisma.userFavorite.findMany({
        where: { userId },
        include: {
          project: {
            include: {
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true
                }
              },
              investments: {
                where: { status: 'CONFIRMED' },
                select: {
                  amount: true
                }
              },
              _count: {
                select: {
                  investments: {
                    where: { status: 'CONFIRMED' }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.userFavorite.count({
        where: { userId }
      })
    ]);

    // Calculate project metrics
    const favoritesWithMetrics = favorites.map(favorite => {
      const project = favorite.project;
      const currentFunding = project.investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const fundingProgress = (currentFunding / Number(project.targetFunding)) * 100;
      const daysRemaining = Math.max(0, Math.ceil((project.fundingDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      return {
        id: favorite.id,
        favoriteDate: favorite.createdAt,
        project: {
          ...project,
          currentFunding,
          fundingProgress: Math.min(100, fundingProgress),
          totalInvestors: project._count.investments,
          daysRemaining,
          isFundingActive: project.status === 'OPEN' && project.fundingDeadline > new Date() && fundingProgress < 100
        }
      };
    });

    return NextResponse.json({
      favorites: favoritesWithMetrics,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== POST /api/favorites ====================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20 favorite toggles per minute per user
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
      keyGenerator: (req) => `favorites-${req.headers.get('user-id')}`
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many favorite actions. Please try again later.' },
        { status: 429 }
      );
    }

    const userId = request.headers.get('user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId } = toggleFavoriteSchema.parse(body);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true, 
        title: true, 
        isActive: true,
        status: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.isActive) {
      return NextResponse.json(
        { error: 'Project is not available' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.userFavorite.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    let isFavorited: boolean;
    let message: string;

    if (existingFavorite) {
      // Remove from favorites
      await prisma.userFavorite.delete({
        where: { id: existingFavorite.id }
      });
      
      isFavorited = false;
      message = 'Project removed from favorites';

      // Log unfavorite action
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PROJECT_UNFAVORITED',
          resource: 'PROJECT',
          resourceId: projectId,
          details: JSON.stringify({
            projectTitle: project.title,
            action: 'removed'
          }),
          ipAddress: request.ip,
          userAgent: request.headers.get('user-agent'),
        }
      });

    } else {
      // Add to favorites
      await prisma.userFavorite.create({
        data: {
          userId,
          projectId
        }
      });

      isFavorited = true;
      message = 'Project added to favorites';

      // Log favorite action
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PROJECT_FAVORITED',
          resource: 'PROJECT',
          resourceId: projectId,
          details: JSON.stringify({
            projectTitle: project.title,
            action: 'added'
          }),
          ipAddress: request.ip,
          userAgent: request.headers.get('user-agent'),
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'project_favorited',
          title: 'Project Saved',
          message: `You've saved "${project.title}" to your favorites.`,
          data: {
            projectId,
            projectTitle: project.title
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      isFavorited,
      projectId,
      message
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    
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