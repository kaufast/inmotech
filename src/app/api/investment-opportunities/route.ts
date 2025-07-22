import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt-rbac-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/investment-opportunities - List investment opportunities with search and filtering (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Filters
    const investmentType = searchParams.get('investmentType');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const riskLevel = searchParams.get('riskLevel');
    const status = searchParams.get('status') || 'ACTIVE';
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const minROI = searchParams.get('minROI');
    const maxROI = searchParams.get('maxROI');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where clause
    const where: any = {
      status,
      isActive: true
    };
    
    if (investmentType) where.investmentType = investmentType;
    if (category) where.category = category;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = country;
    if (riskLevel) where.riskLevel = riskLevel;
    
    // Amount filtering
    if (minAmount || maxAmount) {
      where.targetAmount = {};
      if (minAmount) where.targetAmount.gte = parseFloat(minAmount);
      if (maxAmount) where.targetAmount.lte = parseFloat(maxAmount);
    }
    
    // ROI filtering
    if (minROI || maxROI) {
      where.expectedRoi = {};
      if (minROI) where.expectedRoi.gte = parseFloat(minROI);
      if (maxROI) where.expectedRoi.lte = parseFloat(maxROI);
    }
    
    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Only show opportunities that are still accepting funding
    where.fundingEndDate = { gte: new Date() };
    
    // Build sort order
    const orderBy: any = [];
    
    // Always prioritize featured opportunities
    orderBy.push({ isFeatured: 'desc' });
    
    // Add custom sorting
    if (sortBy === 'targetAmount') {
      orderBy.push({ targetAmount: sortOrder });
    } else if (sortBy === 'expectedRoi') {
      orderBy.push({ expectedRoi: sortOrder });
    } else if (sortBy === 'fundingProgress') {
      // Sort by funding progress (raisedAmount / targetAmount)
      orderBy.push({ raisedAmount: sortOrder });
    } else if (sortBy === 'fundingEndDate') {
      orderBy.push({ fundingEndDate: sortOrder });
    } else {
      orderBy.push({ createdAt: sortOrder });
    }
    
    // Get investment opportunities with creator info
    const [opportunities, totalCount] = await Promise.all([
      prisma.investmentOpportunity.findMany({
        where,
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
          _count: {
            select: {
              investments: true,
              opportunityUpdates: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.investmentOpportunity.count({ where })
    ]);
    
    // Calculate funding progress for each opportunity
    const opportunitiesWithProgress = opportunities.map(opportunity => ({
      ...opportunity,
      fundingProgress: opportunity.targetAmount > 0 
        ? (opportunity.raisedAmount / opportunity.targetAmount) * 100 
        : 0,
      daysLeft: Math.max(0, Math.ceil(
        (opportunity.fundingEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ))
    }));
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      opportunities: opportunitiesWithProgress,
      total: totalCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching investment opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investment opportunities' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/investment-opportunities - Create new investment opportunity (requires authentication)
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'title', 'investmentType', 'category', 'riskLevel', 'targetAmount', 
      'minimumInvestment', 'expectedRoi', 'investmentPeriod', 'city', 
      'fundingStartDate', 'fundingEndDate'
    ];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Validate dates
    const fundingStart = new Date(data.fundingStartDate);
    const fundingEnd = new Date(data.fundingEndDate);
    const now = new Date();
    
    if (fundingStart < now) {
      return NextResponse.json(
        { error: 'Funding start date cannot be in the past' },
        { status: 400 }
      );
    }
    
    if (fundingEnd <= fundingStart) {
      return NextResponse.json(
        { error: 'Funding end date must be after start date' },
        { status: 400 }
      );
    }
    
    // Validate amount constraints
    if (data.minimumInvestment > data.targetAmount) {
      return NextResponse.json(
        { error: 'Minimum investment cannot be greater than target amount' },
        { status: 400 }
      );
    }
    
    if (data.maximumInvestment && data.maximumInvestment < data.minimumInvestment) {
      return NextResponse.json(
        { error: 'Maximum investment cannot be less than minimum investment' },
        { status: 400 }
      );
    }
    
    // Create the investment opportunity
    const opportunity = await prisma.investmentOpportunity.create({
      data: {
        ...data,
        createdBy: user.userId,
        fundingStartDate: fundingStart,
        fundingEndDate: fundingEnd,
        expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : null,
        expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : null,
        status: data.status || 'DRAFT'
      },
      include: {
        creator: {
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
      opportunity
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating investment opportunity:', error);
    
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Investment opportunity with this title already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create investment opportunity' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});