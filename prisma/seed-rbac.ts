import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function seedRBAC() {
  console.log('🌱 Seeding RBAC system...');

  // Create Permissions
  const permissions = [
    // Projects
    { name: 'projects:read', resource: 'projects', action: 'read', description: 'View projects and property listings' },
    { name: 'projects:create', resource: 'projects', action: 'create', description: 'Create new property projects' },
    { name: 'projects:update', resource: 'projects', action: 'update', description: 'Update project details' },
    { name: 'projects:delete', resource: 'projects', action: 'delete', description: 'Delete projects' },
    { name: 'projects:manage', resource: 'projects', action: 'manage', description: 'Full project management access' },
    
    // Investments
    { name: 'investments:read', resource: 'investments', action: 'read', description: 'View investment data' },
    { name: 'investments:create', resource: 'investments', action: 'create', description: 'Make new investments' },
    { name: 'investments:update', resource: 'investments', action: 'update', description: 'Modify investments' },
    { name: 'investments:delete', resource: 'investments', action: 'delete', description: 'Cancel/delete investments' },
    { name: 'investments:manage', resource: 'investments', action: 'manage', description: 'Full investment management' },
    
    // Analytics
    { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View basic analytics' },
    { name: 'analytics:advanced', resource: 'analytics', action: 'advanced', description: 'Access advanced analytics and reports' },
    { name: 'analytics:export', resource: 'analytics', action: 'export', description: 'Export analytics data' },
    
    // Users
    { name: 'users:read', resource: 'users', action: 'read', description: 'View user profiles' },
    { name: 'users:update', resource: 'users', action: 'update', description: 'Update user information' },
    { name: 'users:manage', resource: 'users', action: 'manage', description: 'Full user management' },
    
    // Portfolio
    { name: 'portfolio:read', resource: 'portfolio', action: 'read', description: 'View portfolio data' },
    { name: 'portfolio:manage', resource: 'portfolio', action: 'manage', description: 'Manage portfolio settings' },
    
    // KYC
    { name: 'kyc:read', resource: 'kyc', action: 'read', description: 'View KYC submissions' },
    { name: 'kyc:manage', resource: 'kyc', action: 'manage', description: 'Review and approve KYC submissions' },
    
    // System
    { name: 'system:admin', resource: 'system', action: 'admin', description: 'Full system administration' },
    { name: 'system:settings', resource: 'system', action: 'settings', description: 'Access system settings' },
  ];

  console.log('Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission,
    });
  }

  // Create Roles
  const roles = [
    {
      name: 'investor',
      description: 'Regular investor with access to view projects, make investments, and manage portfolio'
    },
    {
      name: 'property_manager', 
      description: 'Property manager who can create and manage projects, view analytics'
    },
    {
      name: 'analyst',
      description: 'Financial analyst with access to advanced analytics and reporting tools'
    },
    {
      name: 'admin',
      description: 'System administrator with full access to all features'
    }
  ];

  console.log('Creating roles...');
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }

  // Get created roles and permissions for assignment
  const createdRoles = await prisma.role.findMany();
  const createdPermissions = await prisma.permission.findMany();

  // Helper to find role and permission by name
  const findRole = (name: string) => createdRoles.find(r => r.name === name)!;
  const findPermission = (name: string) => createdPermissions.find(p => p.name === name)!;

  // Role Permission Assignments
  const rolePermissions = [
    // Investor Role Permissions
    {
      role: findRole('investor'),
      permissions: [
        'projects:read',
        'investments:read', 
        'investments:create',
        'investments:update',
        'portfolio:read',
        'portfolio:manage',
        'analytics:read',
        'users:read',
        'users:update'
      ]
    },
    
    // Property Manager Role Permissions
    {
      role: findRole('property_manager'),
      permissions: [
        'projects:read',
        'projects:create',
        'projects:update',
        'projects:manage',
        'investments:read',
        'analytics:read',
        'analytics:advanced',
        'analytics:export',
        'users:read',
        'users:update',
        'portfolio:read'
      ]
    },
    
    // Analyst Role Permissions
    {
      role: findRole('analyst'),
      permissions: [
        'projects:read',
        'investments:read',
        'analytics:read',
        'analytics:advanced',
        'analytics:export',
        'portfolio:read',
        'users:read',
        'kyc:read'
      ]
    },
    
    // Admin Role Permissions (all permissions)
    {
      role: findRole('admin'),
      permissions: createdPermissions.map(p => p.name)
    }
  ];

  console.log('Assigning permissions to roles...');
  for (const { role, permissions: permissionNames } of rolePermissions) {
    for (const permissionName of permissionNames) {
      const permission = findPermission(permissionName);
      
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('✅ RBAC system seeded successfully!');
  console.log(`Created ${createdRoles.length} roles and ${createdPermissions.length} permissions`);
  
  // Display role summary
  for (const role of createdRoles) {
    const permCount = await prisma.rolePermission.count({
      where: { roleId: role.id }
    });
    console.log(`  - ${role.name}: ${permCount} permissions`);
  }
}

async function assignDefaultRoles() {
  console.log('🎯 Assigning default roles to existing users...');
  
  const users = await prisma.user.findMany();
  const investorRole = await prisma.role.findUnique({ where: { name: 'investor' } });
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  
  if (!investorRole || !adminRole) {
    console.error('Roles not found. Please run seed-rbac first.');
    return;
  }
  
  for (const user of users) {
    // Assign admin role to users who are already admins
    const targetRole = user.isAdmin ? adminRole : investorRole;
    
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: targetRole.id,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        userId: user.id,
        roleId: targetRole.id,
        isActive: true,
      },
    });
    
    console.log(`  - Assigned ${targetRole.name} role to ${user.email}`);
  }
  
  console.log('✅ Default roles assigned to all users!');
}

async function main() {
  try {
    await seedRBAC();
    await assignDefaultRoles();
  } catch (error) {
    console.error('Error seeding RBAC:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow script to be run directly or imported
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedRBAC, assignDefaultRoles };