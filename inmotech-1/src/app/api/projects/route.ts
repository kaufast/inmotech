import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
// import { getServerSession } from 'next-auth'; // Disabled for build
import { rateLimit } from '@/lib/rate-limit';

// ==================== VALIDATION SCHEMAS ====================

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().max(500, 'Short description too long').optional(),
  location: z.object({
    address: z.string(),
    city: z.string(),
    country: z.string(),
    zipCode: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  projectType: z.enum(['residential', 'commercial', 'mixed_use', 'land']),
  
  // Financial details
  totalValue: z.number().positive('Total value must be positive'),
  targetFunding: z.number().positive('Target funding must be positive'),
  minInvestment: z.number().positive('Minimum investment must be positive'),
  maxInvestment: z.number().positive().optional(),
  expectedReturn: z.number().min(0).max(100, 'Expected return must be between 0-100%'),
  investmentTerm: z.number().int().positive('Investment term must be positive'),
  distributionType: z.enum(['monthly', 'quarterly', 'annual', 'exit_only']),
  
  // Timeline
  fundingDeadline: z.string().datetime('Invalid funding deadline'),
  constructionStart: z.string().datetime().optional(),
  expectedCompletion: z.string().datetime().optional(),
  
  // Media
  imageUrls: z.array(z.string().url()).default([]),
  documentUrls: z.array(z.string().url()).default([]),
  videoUrl: z.string().url().optional(),
  virtualTourUrl: z.string().url().optional(),
  
  // Legal
  legalStructure: z.string().optional(),
  regulatoryApproval: z.boolean().default(false),
  insuranceDetails: z.object({}).optional()
});

const queryProjectsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'OPEN', 'FUNDING_COMPLETE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED']).optional(),
  projectType: z.string().optional(),
  location: z.string().optional(),
  minReturn: z.string().transform(Number).optional(),
  maxReturn: z.string().transform(Number).optional(),
  minInvestment: z.string().transform(Number).optional(),
  maxInvestment: z.string().transform(Number).optional(),
  search: z.string().optional(),
  featured: z.string().transform(Boolean).optional()
});

// ==================== GET /api/projects ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    const {
      page,
      limit,
      status,
      projectType,
      location,
      minReturn,
      maxReturn,
      minInvestment,
      maxInvestment,
      search,
      featured
    } = queryProjectsSchema.parse(params);

    // Build where clause
    const where: any = {
      isActive: true
    };

    if (status) where.status = status;
    if (projectType) where.projectType = projectType;
    if (minReturn || maxReturn) {
      where.expectedReturn = {};
      if (minReturn) where.expectedReturn.gte = minReturn;
      if (maxReturn) where.expectedReturn.lte = maxReturn;
    }
    if (minInvestment || maxInvestment) {
      where.minInvestment = {};
      if (minInvestment) where.minInvestment.gte = minInvestment;
      if (maxInvestment) where.minInvestment.lte = maxInvestment;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { path: ['city'], string_contains: search } }
      ];
    }
    if (featured) {
      where.featuredUntil = { gt: new Date() };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
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
            select: {
              amount: true,
              status: true
            }
          },
          _count: {
            select: {
              investments: true
            }
          }
        },
        orderBy: [
          { featuredUntil: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.project.count({ where })
    ]);

    // Calculate funding progress for each project
    const projectsWithProgress = projects.map(project => ({
      ...project,
      fundingProgress: (Number(project.currentFunding) / Number(project.targetFunding)) * 100,
      confirmedInvestments: project.investments.filter(inv => inv.status === 'CONFIRMED').length,
      totalInvestors: project._count.investments
    }));

    return NextResponse.json({
      projects: projectsWithProgress,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    
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

// ==================== POST /api/projects ====================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 project creations per hour per user
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
      keyGenerator: (req) => req.headers.get('user-id') || req.ip || 'unknown'
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many project creation attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Get user from middleware (added by auth middleware)
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only DEVELOPER, ADMIN, or MODERATOR can create projects
    if (!['DEVELOPER', 'ADMIN', 'MODERATOR'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only developers can create projects.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Validate funding amounts
    if (validatedData.targetFunding > validatedData.totalValue) {
      return NextResponse.json(
        { error: 'Target funding cannot exceed total project value' },
        { status: 400 }
      );
    }

    if (validatedData.maxInvestment && validatedData.maxInvestment < validatedData.minInvestment) {
      return NextResponse.json(
        { error: 'Maximum investment cannot be less than minimum investment' },
        { status: 400 }
      );
    }

    // Validate timeline
    const fundingDeadline = new Date(validatedData.fundingDeadline);
    if (fundingDeadline <= new Date()) {
      return NextResponse.json(
        { error: 'Funding deadline must be in the future' },
        { status: 400 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        ownerId: userId,
        status: 'DRAFT', // All projects start as drafts
        fundingDeadline,
        constructionStart: validatedData.constructionStart ? new Date(validatedData.constructionStart) : null,
        expectedCompletion: validatedData.expectedCompletion ? new Date(validatedData.expectedCompletion) : null,
        totalValue: validatedData.totalValue,
        targetFunding: validatedData.targetFunding,
        minInvestment: validatedData.minInvestment,
        maxInvestment: validatedData.maxInvestment || null,
        expectedReturn: validatedData.expectedReturn,
        location: validatedData.location,
        insuranceDetails: validatedData.insuranceDetails || null
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Log project creation
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PROJECT_CREATED',
        resource: 'PROJECT',
        resourceId: project.id,
        details: JSON.stringify({
          projectTitle: project.title,
          targetFunding: project.targetFunding,
          expectedReturn: project.expectedReturn
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    // TODO: Send notification to admins for review
    // TODO: Create escrow account for the project

    return NextResponse.json({
      project,
      message: 'Project created successfully. It will be reviewed before publishing.'
    }, { status: 201 });

  } catch (error) {
    console.error('Create project error:', error);
    
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