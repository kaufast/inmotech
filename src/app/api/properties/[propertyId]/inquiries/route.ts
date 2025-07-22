import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/properties/[propertyId]/inquiries - Get inquiries for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const where: any = { propertyId: params.propertyId };
    if (status) where.status = status;
    
    const inquiries = await prisma.propertyInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ inquiries });
    
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/properties/[propertyId]/inquiries - Create new inquiry
export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { inquirerName, inquirerEmail, inquirerPhone, message, inquiryType } = await request.json();
    
    // Validate required fields
    if (!inquirerName || !inquirerEmail || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
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
    
    // Create the inquiry
    const inquiry = await prisma.propertyInquiry.create({
      data: {
        propertyId: params.propertyId,
        inquirerName,
        inquirerEmail,
        inquirerPhone,
        message,
        inquiryType: inquiryType || 'general'
      }
    });
    
    // Update property inquiry count
    await prisma.property.update({
      where: { id: params.propertyId },
      data: { inquiries: { increment: 1 } }
    });
    
    // TODO: Send notification email to property owner
    // This would integrate with your email service
    
    return NextResponse.json({
      success: true,
      inquiry,
      message: 'Inquiry sent successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}