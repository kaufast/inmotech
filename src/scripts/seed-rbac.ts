import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default permissions for the system
const DEFAULT_PERMISSIONS = [
  // Projects
  { name: 'projects:read', resource: 'projects', action: 'read', description: 'View projects' },
  { name: 'projects:create', resource: 'projects', action: 'create', description: 'Create new projects' },
  { name: 'projects:update', resource: 'projects', action: 'update', description: 'Update existing projects' },
  { name: 'projects:delete', resource: 'projects', action: 'delete', description: 'Delete projects' },
  { name: 'projects:manage', resource: 'projects', action: 'manage', description: 'Full project management' },

  // Investments
  { name: 'investments:read', resource: 'investments', action: 'read', description: 'View investments' },
  { name: 'investments:create', resource: 'investments', action: 'create', description: 'Make investments' },
  { name: 'investments:update', resource: 'investments', action: 'update', description: 'Update investments' },
  { name: 'investments:delete', resource: 'investments', action: 'delete', description: 'Cancel investments' },
  { name: 'investments:manage', resource: 'investments', action: 'manage', description: 'Full investment management' },

  // Users
  { name: 'users:read', resource: 'users', action: 'read', description: 'View user profiles' },
  { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
  { name: 'users:update', resource: 'users', action: 'update', description: 'Update user profiles' },
  { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { name: 'users:manage', resource: 'users', action: 'manage', description: 'Full user management' },

  // Analytics
  { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'View analytics and reports' },
  { name: 'analytics:create', resource: 'analytics', action: 'create', description: 'Create custom reports' },
  { name: 'analytics:manage', resource: 'analytics', action: 'manage', description: 'Manage analytics system' },

  // KYC
  { name: 'kyc:read', resource: 'kyc', action: 'read', description: 'View KYC submissions' },
  { name: 'kyc:approve', resource: 'kyc', action: 'approve', description: 'Approve KYC submissions' },
  { name: 'kyc:reject', resource: 'kyc', action: 'reject', description: 'Reject KYC submissions' },
  { name: 'kyc:manage', resource: 'kyc', action: 'manage', description: 'Full KYC management' },

  // Payments
  { name: 'payments:read', resource: 'payments', action: 'read', description: 'View payment transactions' },
  { name: 'payments:process', resource: 'payments', action: 'process', description: 'Process payments' },
  { name: 'payments:manage', resource: 'payments', action: 'manage', description: 'Manage payment system' },

  // Admin
  { name: 'admin:read', resource: 'admin', action: 'read', description: 'Access admin dashboard' },
  { name: 'admin:manage', resource: 'admin', action: 'manage', description: 'Full admin access' }
];

// Default roles with their permissions
const DEFAULT_ROLES = [
  {
    name: 'admin',
    description: 'Full system administrator with all permissions',
    permissions: [
      'projects:manage', 'investments:manage', 'users:manage', 
      'analytics:manage', 'kyc:manage', 'payments:manage', 'admin:manage'
    ]
  },
  {
    name: 'fund_manager',
    description: 'Manages investment projects and analyzes performance',
    permissions: [
      'projects:read', 'projects:create', 'projects:update',
      'investments:read', 'investments:manage',
      'analytics:read', 'analytics:create',
      'users:read'
    ]
  },
  {
    name: 'investor',
    description: 'Regular investor with basic investment capabilities',
    permissions: [
      'projects:read',
      'investments:read', 'investments:create',
      'analytics:read'
    ]
  },
  {
    name: 'premium_investor',
    description: 'Premium investor with enhanced features',
    permissions: [
      'projects:read',
      'investments:read', 'investments:create', 'investments:update',
      'analytics:read', 'analytics:create'
    ]
  },
  {
    name: 'analyst',
    description: 'Financial analyst with reporting capabilities',
    permissions: [
      'projects:read',
      'investments:read',
      'analytics:read', 'analytics:create',
      'users:read'
    ]
  },
  {
    name: 'kyc_manager',
    description: 'Manages KYC verification processes',
    permissions: [
      'users:read',
      'kyc:read', 'kyc:approve', 'kyc:reject', 'kyc:manage'
    ]
  },
  {
    name: 'support',
    description: 'Customer support with limited access',
    permissions: [
      'projects:read',
      'investments:read',
      'users:read',
      'kyc:read'
    ]
  }
];

async function seedRBAC() {
  console.log('🌱 Seeding RBAC system...');

  try {
    // Create permissions
    console.log('Creating permissions...');
    for (const permission of DEFAULT_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission
      });
    }
    console.log(`✅ Created ${DEFAULT_PERMISSIONS.length} permissions`);

    // Create roles and assign permissions
    console.log('Creating roles...');
    for (const roleData of DEFAULT_ROLES) {
      // Create or update role
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          description: roleData.description
        },
        create: {
          name: roleData.name,
          description: roleData.description
        }
      });

      // Clear existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      // Add new permissions
      for (const permissionName of roleData.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }

      console.log(`✅ Created role: ${roleData.name} with ${roleData.permissions.length} permissions`);
    }

    // Assign admin role to existing admin users
    console.log('Assigning admin role to existing admin users...');
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });

    const investorRole = await prisma.role.findUnique({
      where: { name: 'investor' }
    });

    if (adminRole && investorRole) {
      // Assign admin role to users with isAdmin = true
      const adminUsers = await prisma.user.findMany({
        where: { isAdmin: true }
      });

      for (const user of adminUsers) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: adminRole.id
            }
          },
          update: {
            isActive: true,
            assignedAt: new Date()
          },
          create: {
            userId: user.id,
            roleId: adminRole.id,
            isActive: true
          }
        });
      }

      // Assign investor role to non-admin users
      const regularUsers = await prisma.user.findMany({
        where: { isAdmin: false }
      });

      for (const user of regularUsers) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: investorRole.id
            }
          },
          update: {
            isActive: true,
            assignedAt: new Date()
          },
          create: {
            userId: user.id,
            roleId: investorRole.id,
            isActive: true
          }
        });
      }

      console.log(`✅ Assigned roles to ${adminUsers.length + regularUsers.length} existing users`);
    }

    console.log('🎉 RBAC system seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding RBAC system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedRBAC()
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { seedRBAC };