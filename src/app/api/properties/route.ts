import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withAuth } from '@/lib/jwt-rbac-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/properties - List properties with search and filtering (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Filters
    const city = searchParams.get('city');
    const propertyType = searchParams.get('propertyType');
    const listingType = searchParams.get('listingType');
    const status = searchParams.get('status') || 'ACTIVE';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const minArea = searchParams.get('minArea');
    const maxArea = searchParams.get('maxArea');
    const search = searchParams.get('search');
    const title = searchParams.get('title');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where clause
    const where: any = {
      status: 'ACTIVE' // Only show active properties to public
    };
    
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
    if (bathrooms) where.bathrooms = { gte: parseFloat(bathrooms) };
    
    // Area filtering
    if (minArea || maxArea) {
      where.totalArea = {};
      if (minArea) where.totalArea.gte = parseFloat(minArea);
      if (maxArea) where.totalArea.lte = parseFloat(maxArea);
    }
    
    // Price filtering
    if (minPrice || maxPrice) {
      if (listingType === 'rent') {
        where.rentPrice = {};
        if (minPrice) where.rentPrice.gte = parseFloat(minPrice);
        if (maxPrice) where.rentPrice.lte = parseFloat(maxPrice);
      } else {
        where.salePrice = {};
        if (minPrice) where.salePrice.gte = parseFloat(minPrice);
        if (maxPrice) where.salePrice.lte = parseFloat(maxPrice);
      }
    }
    
    // Search functionality
    if (search || title) {
      const searchTerm = search || title;
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
        { neighborhood: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Get properties with owner info
    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
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
        orderBy: (() => {
          const order: any = [];
          
          // Always prioritize featured properties
          order.push({ isFeatured: 'desc' });
          
          // Add custom sorting
          if (sortBy === 'price') {
            order.push({ salePrice: sortOrder });
            order.push({ rentPrice: sortOrder });
          } else if (sortBy === 'area') {
            order.push({ totalArea: sortOrder });
          } else if (sortBy === 'views') {
            order.push({ views: sortOrder });
          } else {
            order.push({ createdAt: sortOrder });
          }
          
          return order;
        })(),
        take: limit,
        skip: offset
      }),
      prisma.property.count({ where })
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      properties,
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
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/properties - Create new property (requires authentication)
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'address', 'city', 'country', 'postalCode', 'propertyType', 'listingType'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Create the property
    const property = await prisma.property.create({
      data: {
        ...data,
        ownerId: user.userId,
        publishedAt: data.isPublished ? new Date() : null,
        pricePerSqm: data.totalArea && data.salePrice 
          ? data.salePrice / data.totalArea 
          : null
      },
      include: {
        owner: {
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
      property
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating property:', error);
    
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Property already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});