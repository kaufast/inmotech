import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt-rbac-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/investment-opportunities/[opportunityId] - Get individual investment opportunity (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { opportunityId: string } }
) {
  try {
    const opportunity = await prisma.investmentOpportunity.findUnique({
      where: { 
        id: params.opportunityId,
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fundManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        investments: {
          select: {
            id: true,
            amount: true,
            investmentDate: true,
            status: true,
            investor: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          where: {
            status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] }
          },
          orderBy: { investmentDate: 'desc' },
          take: 10 // Show recent investors
        },
        opportunityUpdates: {
          where: { isPublic: true },
          select: {
            id: true,
            title: true,
            content: true,
            updateType: true,
            priority: true,
            publishedAt: true,
            author: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { publishedAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            investments: true,
            opportunityUpdates: true
          }
        }
      }
    });
    
    if (!opportunity) {
      return NextResponse.json(
        { error: 'Investment opportunity not found' },
        { status: 404 }
      );
    }
    
    // Increment views counter
    await prisma.investmentOpportunity.update({
      where: { id: params.opportunityId },
      data: { views: { increment: 1 } }
    });
    
    // Calculate funding progress and other metrics
    const fundingProgress = opportunity.targetAmount > 0 
      ? (opportunity.raisedAmount / opportunity.targetAmount) * 100 
      : 0;
      
    const daysLeft = Math.max(0, Math.ceil(
      (opportunity.fundingEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ));
    
    const totalInvestedAmount = opportunity.investments.reduce(
      (sum, investment) => sum + investment.amount, 0
    );
    
    const responseData = {
      ...opportunity,
      fundingProgress,
      daysLeft,
      totalInvestedAmount,
      uniqueInvestors: new Set(opportunity.investments.map(inv => inv.investor)).size,
      averageInvestment: opportunity.investments.length > 0 
        ? totalInvestedAmount / opportunity.investments.length 
        : 0
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error fetching investment opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investment opportunity' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/investment-opportunities/[opportunityId] - Update investment opportunity (requires authentication)
export const PUT = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { opportunityId: string } }
) => {
  try {
    // Check if opportunity exists and user has permission
    const existingOpportunity = await prisma.investmentOpportunity.findUnique({
      where: { id: params.opportunityId },
      select: { 
        id: true, 
        createdBy: true, 
        fundManagerId: true,
        status: true,
        raisedAmount: true
      }
    });

    if (!existingOpportunity) {
      return NextResponse.json(
        { error: 'Investment opportunity not found' },
        { status: 404 }
      );
    }

    const isCreator = existingOpportunity.createdBy === user.userId;
    const isFundManager = existingOpportunity.fundManagerId === user.userId;
    const isAdmin = user.isAdmin || user.roles.includes('SUPERADMIN') || user.roles.includes('ADMIN');

    if (!isCreator && !isFundManager && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to update this investment opportunity' },
        { status: 403 }
      );
    }
    
    // Prevent updates if funding has started and there are investments
    if (existingOpportunity.raisedAmount > 0 && existingOpportunity.status !== 'DRAFT') {
      const restrictedFields = [
        'targetAmount', 'minimumInvestment', 'maximumInvestment', 
        'expectedRoi', 'investmentPeriod', 'investmentType'
      ];
      
      const data = await request.json();
      const hasRestrictedChanges = restrictedFields.some(field => 
        data.hasOwnProperty(field)
      );
      
      if (hasRestrictedChanges) {
        return NextResponse.json(
          { error: 'Cannot modify key investment terms after funding has started' },
          { status: 400 }
        );
      }
    }
    
    const updateData = await request.json();
    
    // Validate dates if provided
    if (updateData.fundingStartDate || updateData.fundingEndDate) {
      const fundingStart = updateData.fundingStartDate 
        ? new Date(updateData.fundingStartDate) 
        : undefined;
      const fundingEnd = updateData.fundingEndDate 
        ? new Date(updateData.fundingEndDate) 
        : undefined;
      
      if (fundingStart && fundingEnd && fundingEnd <= fundingStart) {
        return NextResponse.json(
          { error: 'Funding end date must be after start date' },
          { status: 400 }
        );
      }
    }
    
    // Update the investment opportunity
    const updatedOpportunity = await prisma.investmentOpportunity.update({
      where: { id: params.opportunityId },
      data: {
        ...updateData,
        fundingStartDate: updateData.fundingStartDate 
          ? new Date(updateData.fundingStartDate) 
          : undefined,
        fundingEndDate: updateData.fundingEndDate 
          ? new Date(updateData.fundingEndDate) 
          : undefined,
        expectedStartDate: updateData.expectedStartDate 
          ? new Date(updateData.expectedStartDate) 
          : undefined,
        expectedCompletionDate: updateData.expectedCompletionDate 
          ? new Date(updateData.expectedCompletionDate) 
          : undefined,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fundManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      opportunity: updatedOpportunity
    });
    
  } catch (error) {
    console.error('Error updating investment opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update investment opportunity' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// DELETE /api/investment-opportunities/[opportunityId] - Delete/deactivate investment opportunity (requires authentication)
export const DELETE = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { opportunityId: string } }
) => {
  try {
    // Check if opportunity exists and user has permission
    const existingOpportunity = await prisma.investmentOpportunity.findUnique({
      where: { id: params.opportunityId },
      select: { 
        id: true, 
        createdBy: true, 
        fundManagerId: true,
        status: true,
        raisedAmount: true,
        _count: {
          select: {
            investments: true
          }
        }
      }
    });

    if (!existingOpportunity) {
      return NextResponse.json(
        { error: 'Investment opportunity not found' },
        { status: 404 }
      );
    }

    const isCreator = existingOpportunity.createdBy === user.userId;
    const isFundManager = existingOpportunity.fundManagerId === user.userId;
    const isAdmin = user.isAdmin || user.roles.includes('SUPERADMIN') || user.roles.includes('ADMIN');

    if (!isCreator && !isFundManager && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this investment opportunity' },
        { status: 403 }
      );
    }
    
    // If there are active investments, only deactivate (don't delete)
    if (existingOpportunity._count.investments > 0) {
      await prisma.investmentOpportunity.update({
        where: { id: params.opportunityId },
        data: { 
          isActive: false,
          status: 'CANCELLED'
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Investment opportunity deactivated due to existing investments'
      });
    } else {
      // Safe to delete if no investments exist
      await prisma.investmentOpportunity.delete({
        where: { id: params.opportunityId }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Investment opportunity deleted successfully'
      });
    }
    
  } catch (error) {
    console.error('Error deleting investment opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to delete investment opportunity' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});