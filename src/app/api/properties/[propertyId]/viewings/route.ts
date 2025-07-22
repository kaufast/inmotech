import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/properties/[propertyId]/viewings - Get viewings for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    
    const where: any = { propertyId: params.propertyId };
    if (status) where.status = status;
    if (upcoming) {
      where.scheduledDate = { gte: new Date() };
      where.status = { in: ['SCHEDULED', 'CONFIRMED'] };
    }
    
    const viewings = await prisma.propertyViewing.findMany({
      where,
      orderBy: { scheduledDate: 'asc' }
    });
    
    return NextResponse.json({ viewings });
    
  } catch (error) {
    console.error('Error fetching viewings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch viewings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/properties/[propertyId]/viewings - Schedule a viewing
export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { viewerName, viewerEmail, viewerPhone, scheduledDate, duration, notes } = await request.json();
    
    // Validate required fields
    if (!viewerName || !viewerEmail || !scheduledDate) {
      return NextResponse.json(
        { error: 'Name, email, and scheduled date are required' },
        { status: 400 }
      );
    }
    
    // Validate date is in the future
    const viewingDate = new Date(scheduledDate);
    if (viewingDate <= new Date()) {
      return NextResponse.json(
        { error: 'Viewing date must be in the future' },
        { status: 400 }
      );
    }
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { id: true, title: true, ownerId: true }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Check for conflicting viewings (simple overlap check)
    const endTime = new Date(viewingDate.getTime() + (duration || 60) * 60000);
    const conflictingViewing = await prisma.propertyViewing.findFirst({
      where: {
        propertyId: params.propertyId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { scheduledDate: { lte: viewingDate } },
              { scheduledDate: { gte: new Date(viewingDate.getTime() - 60 * 60000) } }
            ]
          },
          {
            AND: [
              { scheduledDate: { gte: viewingDate } },
              { scheduledDate: { lte: endTime } }
            ]
          }
        ]
      }
    });
    
    if (conflictingViewing) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please choose a different time.' },
        { status: 409 }
      );
    }
    
    // Create the viewing
    const viewing = await prisma.propertyViewing.create({
      data: {
        propertyId: params.propertyId,
        viewerName,
        viewerEmail,
        viewerPhone,
        scheduledDate: viewingDate,
        duration: duration || 60,
        notes
      }
    });
    
    // TODO: Send confirmation emails to viewer and property owner
    // This would integrate with your email service
    
    return NextResponse.json({
      success: true,
      viewing,
      message: 'Viewing scheduled successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error scheduling viewing:', error);
    return NextResponse.json(
      { error: 'Failed to schedule viewing' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}