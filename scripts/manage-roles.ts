import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

interface UserRoleAssignment {
  email: string;
  role: string;
}

async function assignUserRole(email: string, roleName: string, assignedBy?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      console.error(`❌ Role not found: ${roleName}`);
      console.log('Available roles: investor, property_manager, analyst, admin');
      return false;
    }

    // Remove any existing roles for this user first (single role per user for now)
    await prisma.userRole.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    // Assign the new role
    const userRole = await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {
        isActive: true,
        assignedBy,
        assignedAt: new Date(),
      },
      create: {
        userId: user.id,
        roleId: role.id,
        isActive: true,
        assignedBy,
      },
    });

    console.log(`✅ Successfully assigned ${roleName} role to ${email}`);
    return true;
  } catch (error) {
    console.error('Error assigning role:', error);
    return false;
  }
}

async function getUserRoles(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return null;
    }

    console.log(`👤 User: ${user.email} (${user.firstName} ${user.lastName})`);
    
    if (user.userRoles.length === 0) {
      console.log('   No roles assigned');
      return user;
    }

    user.userRoles.forEach((userRole) => {
      console.log(`   🎭 Role: ${userRole.role.name}`);
      console.log(`      Description: ${userRole.role.description || 'N/A'}`);
      console.log(`      Assigned: ${userRole.assignedAt.toISOString()}`);
      console.log(`      Permissions (${userRole.role.rolePermissions.length}):`);
      
      userRole.role.rolePermissions.forEach((rp) => {
        console.log(`        - ${rp.permission.name}: ${rp.permission.description}`);
      });
      console.log('');
    });

    return user;
  } catch (error) {
    console.error('Error getting user roles:', error);
    return null;
  }
}

async function listAllRoles() {
  try {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          where: { isActive: true },
          include: {
            user: {
              select: { email: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    console.log('📋 Available Roles:');
    console.log('===================');

    roles.forEach((role) => {
      console.log(`\n🎭 ${role.name.toUpperCase()}`);
      console.log(`   Description: ${role.description || 'N/A'}`);
      console.log(`   Users (${role.userRoles.length}):`);
      
      if (role.userRoles.length === 0) {
        console.log('     No users assigned');
      } else {
        role.userRoles.forEach((ur) => {
          console.log(`     - ${ur.user.email} (${ur.user.firstName} ${ur.user.lastName})`);
        });
      }

      console.log(`   Permissions (${role.rolePermissions.length}):`);
      role.rolePermissions.forEach((rp) => {
        console.log(`     - ${rp.permission.name}`);
      });
    });

  } catch (error) {
    console.error('Error listing roles:', error);
  }
}

async function bulkAssignRoles(assignments: UserRoleAssignment[]) {
  console.log('🔄 Bulk assigning roles...');
  
  for (const { email, role } of assignments) {
    await assignUserRole(email, role);
  }
  
  console.log('✅ Bulk role assignment completed!');
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'assign':
      if (args.length < 3) {
        console.log('Usage: npm run manage-roles assign <email> <role>');
        console.log('Roles: investor, property_manager, analyst, admin');
        process.exit(1);
      }
      await assignUserRole(args[1], args[2]);
      break;

    case 'get':
      if (args.length < 2) {
        console.log('Usage: npm run manage-roles get <email>');
        process.exit(1);
      }
      await getUserRoles(args[1]);
      break;

    case 'list':
      await listAllRoles();
      break;

    case 'bulk':
      // Example bulk assignment
      await bulkAssignRoles([
        { email: 'test@example.com', role: 'investor' },
        { email: 'manager@example.com', role: 'property_manager' },
        { email: 'analyst@example.com', role: 'analyst' },
      ]);
      break;

    default:
      console.log('Available commands:');
      console.log('  assign <email> <role>  - Assign role to user');
      console.log('  get <email>           - Get user roles and permissions');
      console.log('  list                  - List all roles and their users');
      console.log('  bulk                  - Run example bulk assignment');
      console.log('');
      console.log('Available roles: investor, property_manager, analyst, admin');
      break;
  }

  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch(console.error);
}

export { assignUserRole, getUserRoles, listAllRoles, bulkAssignRoles };