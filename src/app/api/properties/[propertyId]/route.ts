import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt-rbac-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/properties/[propertyId] - Get specific property
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const property = await prisma.property.findUnique({
      where: { 
        id: params.propertyId,
        isPublished: true // Only show published properties in public API
      },
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
        inquiries_list: {
          select: {
            id: true,
            inquiryType: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        viewings: {
          where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } },
          select: {
            id: true,
            scheduledDate: true,
            status: true
          },
          orderBy: { scheduledDate: 'asc' },
          take: 10
        },
        _count: {
          select: {
            inquiries_list: true,
            viewings: true,
            watchlistedBy: true
          }
        }
      }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.property.update({
      where: { id: params.propertyId },
      data: { views: { increment: 1 } }
    });

    return NextResponse.json({ property });

  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/properties/[propertyId] - Update property (owner or admin only)
export const PUT = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { propertyId: string } }
) => {
  try {
    const data = await request.json();

    // Check if property exists and get ownership info
    const existingProperty = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { ownerId: true, agentId: true }
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Check permissions: owner, assigned agent, or admin
    const isOwner = existingProperty.ownerId === user.userId;
    const isAssignedAgent = existingProperty.agentId === user.userId;
    const isAdmin = user.isAdmin;

    if (!isOwner && !isAssignedAgent && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this property' },
        { status: 403 }
      );
    }

    // Update the property
    const property = await prisma.property.update({
      where: { id: params.propertyId },
      data: {
        ...data,
        publishedAt: data.isPublished && !existingProperty ? new Date() : undefined,
        pricePerSqm: data.totalArea && data.salePrice 
          ? data.salePrice / data.totalArea 
          : undefined,
        updatedAt: new Date()
      },
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      property
    });

  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// DELETE /api/properties/[propertyId] - Delete property (owner or admin only)
export const DELETE = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { propertyId: string } }
) => {
  try {
    // Check if property exists and get ownership info
    const existingProperty = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { 
        ownerId: true, 
        title: true,
        _count: {
          select: {
            inquiries_list: true,
            viewings: { where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } } }
          }
        }
      }
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Check permissions: owner or admin only
    const isOwner = existingProperty.ownerId === user.userId;
    const isAdmin = user.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this property' },
        { status: 403 }
      );
    }

    // Check for active viewings
    if (existingProperty._count.viewings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete property with scheduled viewings' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to INACTIVE instead of hard delete
    // This preserves inquiries and viewing history
    await prisma.property.update({
      where: { id: params.propertyId },
      data: { 
        status: 'INACTIVE',
        isPublished: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});