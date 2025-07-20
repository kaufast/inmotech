import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// ==================== VALIDATION SCHEMAS ====================

const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  shortDescription: z.string().max(500).optional(),
  location: z.object({
    address: z.string(),
    city: z.string(),
    country: z.string(),
    zipCode: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }).optional(),
  projectType: z.enum(['residential', 'commercial', 'mixed_use', 'land']).optional(),
  
  // Financial details (only allow updates for DRAFT projects)
  totalValue: z.number().positive().optional(),
  targetFunding: z.number().positive().optional(),
  minInvestment: z.number().positive().optional(),
  maxInvestment: z.number().positive().optional(),
  expectedReturn: z.number().min(0).max(100).optional(),
  investmentTerm: z.number().int().positive().optional(),
  distributionType: z.enum(['monthly', 'quarterly', 'annual', 'exit_only']).optional(),
  
  // Timeline
  fundingDeadline: z.string().datetime().optional(),
  constructionStart: z.string().datetime().optional(),
  expectedCompletion: z.string().datetime().optional(),
  
  // Media
  imageUrls: z.array(z.string().url()).optional(),
  documentUrls: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
  virtualTourUrl: z.string().url().optional(),
  
  // Legal
  legalStructure: z.string().optional(),
  regulatoryApproval: z.boolean().optional(),
  insuranceDetails: z.object({}).optional(),
  
  // Status updates (admin only)
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'OPEN', 'FUNDING_COMPLETE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED']).optional(),
  featuredUntil: z.string().datetime().optional()
});

// ==================== GET /api/projects/[id] ====================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true
          }
        },
        investments: {
          where: { status: 'CONFIRMED' },
          select: {
            id: true,
            amount: true,
            investmentDate: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { investmentDate: 'desc' }
        },
        projectUpdates: {
          where: { isPublic: true },
          select: {
            id: true,
            title: true,
            content: true,
            updateType: true,
            imageUrls: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        escrowAccounts: {
          select: {
            id: true,
            balance: true,
            currency: true,
            status: true
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
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if project is publicly visible
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');
    const isOwner = userId === project.ownerId;
    const isAdmin = ['ADMIN', 'MODERATOR'].includes(userRole || '');

    if (!project.isActive && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.status === 'DRAFT' && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Project not available' },
        { status: 403 }
      );
    }

    // Calculate project metrics
    const confirmedInvestments = project.investments;
    const totalRaised = confirmedInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const fundingProgress = (totalRaised / Number(project.targetFunding)) * 100;
    const totalInvestors = project._count.investments;
    const daysRemaining = Math.max(0, Math.ceil((project.fundingDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    const projectWithMetrics = {
      ...project,
      currentFunding: totalRaised,
      fundingProgress: Math.min(100, fundingProgress),
      totalInvestors,
      daysRemaining,
      isFullyFunded: fundingProgress >= 100,
      isFundingActive: project.status === 'OPEN' && project.fundingDeadline > new Date() && fundingProgress < 100
    };

    return NextResponse.json({ project: projectWithMetrics });

  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== PUT /api/projects/[id] ====================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
      keyGenerator: (req) => `update-project-${req.headers.get('user-id')}-${id}`
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many update attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get existing project
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: {
        ownerId: true,
        status: true,
        currentFunding: true
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const isOwner = userId === existingProject.ownerId;
    const isAdmin = ['ADMIN', 'MODERATOR'].includes(userRole || '');

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // Validate business rules
    if (validatedData.status && !isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can change project status' },
        { status: 403 }
      );
    }

    // Don't allow financial changes if project has investments
    const hasInvestments = Number(existingProject.currentFunding) > 0;
    const financialFields = ['totalValue', 'targetFunding', 'minInvestment', 'maxInvestment', 'expectedReturn'];
    const isUpdatingFinancials = financialFields.some(field => validatedData[field as keyof typeof validatedData] !== undefined);

    if (hasInvestments && isUpdatingFinancials && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot modify financial terms after receiving investments' },
        { status: 400 }
      );
    }

    // Validate timeline updates
    if (validatedData.fundingDeadline) {
      const newDeadline = new Date(validatedData.fundingDeadline);
      if (newDeadline <= new Date()) {
        return NextResponse.json(
          { error: 'Funding deadline must be in the future' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    if (validatedData.fundingDeadline) {
      updateData.fundingDeadline = new Date(validatedData.fundingDeadline);
    }
    if (validatedData.constructionStart) {
      updateData.constructionStart = new Date(validatedData.constructionStart);
    }
    if (validatedData.expectedCompletion) {
      updateData.expectedCompletion = new Date(validatedData.expectedCompletion);
    }
    if (validatedData.featuredUntil) {
      updateData.featuredUntil = new Date(validatedData.featuredUntil);
    }

    // Convert numeric fields
    if (validatedData.totalValue) updateData.totalValue = validatedData.totalValue;
    if (validatedData.targetFunding) updateData.targetFunding = validatedData.targetFunding;
    if (validatedData.minInvestment) updateData.minInvestment = validatedData.minInvestment;
    if (validatedData.maxInvestment) updateData.maxInvestment = validatedData.maxInvestment;
    if (validatedData.expectedReturn) updateData.expectedReturn = validatedData.expectedReturn;

    updateData.updatedAt = new Date();

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
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

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PROJECT_UPDATED',
        resource: 'PROJECT',
        resourceId: id,
        details: JSON.stringify({
          updatedFields: Object.keys(validatedData),
          projectTitle: updatedProject.title,
          statusChange: validatedData.status ? `${existingProject.status} -> ${validatedData.status}` : null
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    // TODO: Send notifications for important status changes
    // TODO: Update escrow account if financial terms changed

    return NextResponse.json({
      project: updatedProject,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Update project error:', error);
    
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

// ==================== DELETE /api/projects/[id] ====================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get project with investment info
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        ownerId: true,
        title: true,
        status: true,
        currentFunding: true,
        _count: {
          select: {
            investments: {
              where: { status: 'CONFIRMED' }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const isOwner = userId === project.ownerId;
    const isAdmin = ['ADMIN', 'MODERATOR'].includes(userRole || '');

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Don't allow deletion if project has confirmed investments
    if (project._count.investments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete project with confirmed investments. Consider marking it as cancelled instead.' },
        { status: 400 }
      );
    }

    // Only allow deletion of DRAFT projects or admin override
    if (project.status !== 'DRAFT' && !isAdmin) {
      return NextResponse.json(
        { error: 'Only draft projects can be deleted. Published projects should be cancelled instead.' },
        { status: 400 }
      );
    }

    // Soft delete (mark as inactive) instead of hard delete
    await prisma.project.update({
      where: { id },
      data: {
        isActive: false,
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PROJECT_DELETED',
        resource: 'PROJECT',
        resourceId: id,
        details: JSON.stringify({
          projectTitle: project.title,
          deletionReason: 'User requested deletion',
          wasPublished: project.status !== 'DRAFT'
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });

    return NextResponse.json({
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}