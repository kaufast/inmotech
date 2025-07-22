import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/jwt-rbac-middleware';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// POST /api/properties/[propertyId]/images - Upload property images
export const POST = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { propertyId: string } }
) => {
  try {
    // Check if property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { id: true, ownerId: true, agentId: true, images: true }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const isOwner = property.ownerId === user.userId;
    const isAgent = property.agentId === user.userId;
    const isAdmin = user.isAdmin || user.roles.includes('SUPERADMIN') || user.roles.includes('ADMIN');

    if (!isOwner && !isAgent && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to upload images' }, { status: 403 });
    }

    const data = await request.formData();
    const files: File[] = [];
    
    // Collect all files from the form data
    const entries = Array.from(data.entries());
    for (const [key, value] of entries) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate files
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB.` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has invalid type. Allowed types: JPG, PNG, WebP` },
          { status: 400 }
        );
      }
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'properties', params.propertyId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedImages: string[] = [];

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${i}.${extension}`;
      const filepath = join(uploadDir, filename);
      
      await writeFile(filepath, buffer);
      
      // Store relative path for database
      const relativePath = `/uploads/properties/${params.propertyId}/${filename}`;
      uploadedImages.push(relativePath);
    }

    // Update property with new images
    const updatedImages = [...(property.images || []), ...uploadedImages];
    await prisma.property.update({
      where: { id: params.propertyId },
      data: { images: updatedImages }
    });

    return NextResponse.json({
      success: true,
      uploadedImages,
      totalImages: updatedImages.length,
      message: `${uploadedImages.length} image(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// DELETE /api/properties/[propertyId]/images - Delete property image
export const DELETE = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { propertyId: string } }
) => {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Check if property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { id: true, ownerId: true, agentId: true, images: true }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const isOwner = property.ownerId === user.userId;
    const isAgent = property.agentId === user.userId;
    const isAdmin = user.isAdmin || user.roles.includes('SUPERADMIN') || user.roles.includes('ADMIN');

    if (!isOwner && !isAgent && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to delete images' }, { status: 403 });
    }

    // Remove image from property
    const updatedImages = (property.images || []).filter(img => img !== imageUrl);
    
    await prisma.property.update({
      where: { id: params.propertyId },
      data: { images: updatedImages }
    });

    // TODO: Delete physical file from filesystem
    // This would require proper path validation to avoid directory traversal attacks

    return NextResponse.json({
      success: true,
      remainingImages: updatedImages.length,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

// PUT /api/properties/[propertyId]/images - Reorder property images
export const PUT = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { propertyId: string } }
) => {
  try {
    const { imageOrder } = await request.json();

    if (!Array.isArray(imageOrder)) {
      return NextResponse.json({ error: 'Image order must be an array' }, { status: 400 });
    }

    // Check if property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { id: true, ownerId: true, agentId: true, images: true }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const isOwner = property.ownerId === user.userId;
    const isAgent = property.agentId === user.userId;
    const isAdmin = user.isAdmin || user.roles.includes('SUPERADMIN') || user.roles.includes('ADMIN');

    if (!isOwner && !isAgent && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to reorder images' }, { status: 403 });
    }

    // Validate that all images in the new order exist in current images
    const currentImages = property.images || [];
    const invalidImages = imageOrder.filter(img => !currentImages.includes(img));
    
    if (invalidImages.length > 0) {
      return NextResponse.json(
        { error: 'Invalid images in order array' },
        { status: 400 }
      );
    }

    // Update property with new image order
    await prisma.property.update({
      where: { id: params.propertyId },
      data: { images: imageOrder }
    });

    return NextResponse.json({
      success: true,
      imageOrder,
      message: 'Image order updated successfully'
    });

  } catch (error) {
    console.error('Error reordering images:', error);
    return NextResponse.json(
      { error: 'Failed to reorder images' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});