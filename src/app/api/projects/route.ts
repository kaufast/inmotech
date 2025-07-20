import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

// GET /api/projects - List all projects (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const location = searchParams.get('location');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    const where: any = {};
    
    if (status) where.status = status;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (minAmount) where.targetAmount = { gte: parseInt(minAmount) };
    if (maxAmount) where.targetAmount = { lte: parseInt(maxAmount) };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { investments: true }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    // Calculate raised amounts
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const raisedAmount = await prisma.investment.aggregate({
          where: { 
            projectId: project.id,
            status: { in: ['CONFIRMED', 'COMPLETED'] }
          },
          _sum: { amount: true }
        });

        return {
          ...project,
          raisedAmount: raisedAmount._sum.amount || 0,
          investorCount: project._count.investments,
          fundingProgress: Math.round(
            ((raisedAmount._sum.amount || 0) / project.targetAmount) * 100
          )
        };
      })
    );

    return NextResponse.json({
      projects: projectsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId! }
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const projectData = await request.json();

    const project = await prisma.project.create({
      data: {
        title: projectData.title,
        description: projectData.description,
        location: projectData.location,
        targetAmount: projectData.targetAmount,
        currency: projectData.currency || 'EUR',
        expectedReturn: projectData.expectedReturn,
        duration: projectData.duration,
        riskLevel: projectData.riskLevel,
        propertyType: projectData.propertyType,
        images: projectData.images || [],
        documents: projectData.documents || [],
        milestones: projectData.milestones || [],
        status: 'ACTIVE',
        createdBy: authResult.userId!,
      }
    });

    return NextResponse.json(project, { status: 201 });

  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}