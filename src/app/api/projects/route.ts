import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermissions } from '@/lib/jwt-rbac-middleware';

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
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    // TODO: Update to work with new investment schema
    const projectsWithStats = projects.map(project => ({
      ...project,
      raisedAmount: 0,
      investorCount: 0,
      fundingProgress: 0
    }));

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

// POST /api/projects - Create new project (requires projects:create permission)
const createProject = async (request: NextRequest, user: any) => {
  try {
    const projectData = await request.json();

    console.log(`User ${user.email} (${user.roles.join(', ')}) creating project: ${projectData.title}`);

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
        createdBy: user.userId,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project,
      createdBy: {
        email: user.email,
        roles: user.roles
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
};

export const POST = requirePermissions(['projects:create'])(createProject);