import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt-rbac-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/properties/[propertyId]/watchlist - Add property to user's watchlist
export const POST = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { propertyId: string } }
) => {
  try {
    const { notes } = await request.json();
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { id: true, title: true }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Check if already in watchlist
    const existing = await prisma.propertyWatchlist.findUnique({
      where: {
        userId_propertyId: {
          userId: user.userId,
          propertyId: params.propertyId
        }
      }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Property is already in your watchlist' },
        { status: 409 }
      );
    }
    
    // Add to watchlist
    const watchlistItem = await prisma.propertyWatchlist.create({
      data: {
        userId: user.userId,
        propertyId: params.propertyId,
        notes
      }
    });
    
    return NextResponse.json({
      success: true,
      watchlistItem,
      message: 'Property added to watchlist'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add property to watchlist' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// DELETE /api/properties/[propertyId]/watchlist - Remove property from user's watchlist
export const DELETE = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { propertyId: string } }
) => {
  try {
    // Check if in watchlist
    const existing = await prisma.propertyWatchlist.findUnique({
      where: {
        userId_propertyId: {
          userId: user.userId,
          propertyId: params.propertyId
        }
      }
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found in your watchlist' },
        { status: 404 }
      );
    }
    
    // Remove from watchlist
    await prisma.propertyWatchlist.delete({
      where: {
        userId_propertyId: {
          userId: user.userId,
          propertyId: params.propertyId
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Property removed from watchlist'
    });
    
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove property from watchlist' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});