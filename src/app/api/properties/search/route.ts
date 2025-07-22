import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Advanced search parameters
    const query = searchParams.get('q') || '';
    const city = searchParams.get('city');
    const propertyType = searchParams.get('propertyType');
    const listingType = searchParams.get('listingType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minBedrooms = searchParams.get('minBedrooms');
    const maxBedrooms = searchParams.get('maxBedrooms');
    const minBathrooms = searchParams.get('minBathrooms');
    const minArea = searchParams.get('minArea');
    const maxArea = searchParams.get('maxArea');
    const features = searchParams.get('features'); // comma-separated list
    const energyRating = searchParams.get('energyRating');
    const condition = searchParams.get('condition');
    const sortBy = searchParams.get('sortBy') || 'relevance'; // price, date, area, relevance
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const radius = searchParams.get('radius'); // for location-based search
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Build complex where clause
    const where: any = {
      isPublished: true,
      status: 'ACTIVE'
    };
    
    // Text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { neighborhood: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Location filters
    if (city) where.city = { contains: city, mode: 'insensitive' };
    
    // Property type filter
    if (propertyType) {
      if (propertyType.includes(',')) {
        where.propertyType = { in: propertyType.split(',') };
      } else {
        where.propertyType = propertyType;
      }
    }
    
    // Listing type filter
    if (listingType) where.listingType = listingType;
    
    // Price range
    if (minPrice || maxPrice) {
      const priceField = listingType === 'rent' ? 'rentPrice' : 'salePrice';
      where[priceField] = {};
      if (minPrice) where[priceField].gte = parseFloat(minPrice);
      if (maxPrice) where[priceField].lte = parseFloat(maxPrice);
    }
    
    // Bedroom filter
    if (minBedrooms || maxBedrooms) {
      where.bedrooms = {};
      if (minBedrooms) where.bedrooms.gte = parseInt(minBedrooms);
      if (maxBedrooms) where.bedrooms.lte = parseInt(maxBedrooms);
    }
    
    // Bathroom filter
    if (minBathrooms) {
      where.bathrooms = { gte: parseInt(minBathrooms) };
    }
    
    // Area filter
    if (minArea || maxArea) {
      where.totalArea = {};
      if (minArea) where.totalArea.gte = parseFloat(minArea);
      if (maxArea) where.totalArea.lte = parseFloat(maxArea);
    }
    
    // Features filter
    if (features) {
      const featureList = features.split(',');
      where.features = {
        path: [],
        array_contains: featureList
      };
    }
    
    // Energy rating
    if (energyRating) where.energyRating = energyRating;
    
    // Property condition
    if (condition) where.condition = condition;
    
    // Build orderBy clause
    let orderBy: any = [];
    
    switch (sortBy) {
      case 'price':
        const priceField = listingType === 'rent' ? 'rentPrice' : 'salePrice';
        orderBy.push({ [priceField]: sortOrder });
        break;
      case 'date':
        orderBy.push({ createdAt: sortOrder });
        break;
      case 'area':
        orderBy.push({ totalArea: sortOrder });
        break;
      case 'views':
        orderBy.push({ views: sortOrder });
        break;
      default: // relevance
        orderBy = [
          { isFeatured: 'desc' },
          { views: 'desc' },
          { createdAt: 'desc' }
        ];
    }
    
    // Location-based search (if coordinates provided)
    let locationFilter = {};
    if (lat && lng && radius) {
      // This is a simplified approach - for production, you'd want to use PostGIS
      const latFloat = parseFloat(lat);
      const lngFloat = parseFloat(lng);
      const radiusKm = parseFloat(radius);
      
      // Rough bounding box (not precise, but works for basic filtering)
      const latDelta = radiusKm / 111; // 1 degree lat ≈ 111km
      const lngDelta = radiusKm / (111 * Math.cos(latFloat * Math.PI / 180));
      
      where.latitude = {
        gte: latFloat - latDelta,
        lte: latFloat + latDelta
      };
      where.longitude = {
        gte: lngFloat - lngDelta,
        lte: lngFloat + lngDelta
      };
    }
    
    // Execute search
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
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.property.count({ where })
    ]);
    
    // Get search aggregations for faceted search
    const aggregations = await Promise.all([
      // Property types
      prisma.property.groupBy({
        by: ['propertyType'],
        where: { ...where, propertyType: undefined },
        _count: true
      }),
      // Cities
      prisma.property.groupBy({
        by: ['city'],
        where: { ...where, city: undefined },
        _count: true,
        orderBy: { _count: { city: 'desc' } },
        take: 10
      }),
      // Price ranges (simplified)
      prisma.property.aggregate({
        where,
        _min: { salePrice: true, rentPrice: true },
        _max: { salePrice: true, rentPrice: true },
        _avg: { salePrice: true, rentPrice: true }
      })
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      properties,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      aggregations: {
        propertyTypes: aggregations[0],
        cities: aggregations[1],
        priceStats: aggregations[2]
      },
      searchQuery: {
        query,
        filters: {
          city,
          propertyType,
          listingType,
          minPrice,
          maxPrice,
          minBedrooms,
          maxBedrooms,
          minBathrooms,
          minArea,
          maxArea,
          features: features?.split(','),
          energyRating,
          condition
        },
        sort: { by: sortBy, order: sortOrder }
      }
    });
    
  } catch (error) {
    console.error('Error in property search:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}