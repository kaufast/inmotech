#!/usr/bin/env tsx

/**
 * User Role Management Script - Change User Role
 * Usage: npm run change-role <email> <newRole>
 */

import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

class RoleManager {
  async changeUserRole(email: string, newRoleName: string) {
    try {
      console.log('🔄 Changing role for user:', email);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          userRoles: {
            include: { role: true },
            where: { isActive: true }
          }
        }
      });

      if (!user) {
        console.log('❌ User not found:', email);
        return null;
      }

      // Find the new role
      const newRole = await prisma.role.findUnique({
        where: { name: newRoleName }
      });

      if (!newRole) {
        console.log('❌ Role not found:', newRoleName);
        console.log('Available roles:');
        await this.listRoles();
        return null;
      }

      // Check if user already has this role
      const hasRole = user.userRoles.some(ur => ur.role.name === newRoleName);
      if (hasRole) {
        console.log('⚠️  User already has role:', newRoleName);
        return user;
      }

      // Deactivate current roles
      await prisma.userRole.updateMany({
        where: {
          userId: user.id,
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      // Add new role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: newRole.id,
          isActive: true
        }
      });

      // Update admin status based on role
      const isAdmin = newRoleName === 'admin';
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin }
      });

      console.log('✅ Role changed successfully!');
      console.log('👤 User:', user.email);
      console.log('🏷️  Old roles:', user.userRoles.map(ur => ur.role.name).join(', '));
      console.log('🆕 New role:', newRoleName);
      console.log('👑 Admin status:', isAdmin);

      return user;

    } catch (error) {
      console.error('❌ Error changing user role:', error);
      throw error;
    }
  }

  async addRoleToUser(email: string, roleName: string) {
    try {
      console.log('➕ Adding role to user:', email);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          userRoles: {
            include: { role: true },
            where: { isActive: true }
          }
        }
      });

      if (!user) {
        console.log('❌ User not found:', email);
        return null;
      }

      // Find the role
      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        console.log('❌ Role not found:', roleName);
        await this.listRoles();
        return null;
      }

      // Check if user already has this role
      const hasRole = user.userRoles.some(ur => ur.role.name === roleName && ur.isActive);
      if (hasRole) {
        console.log('⚠️  User already has role:', roleName);
        return user;
      }

      // Add the role (without removing existing ones)
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          isActive: true
        }
      });

      // Update admin status if adding admin role
      if (roleName === 'admin') {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true }
        });
      }

      console.log('✅ Role added successfully!');
      console.log('👤 User:', user.email);
      console.log('➕ Added role:', roleName);

      return user;

    } catch (error) {
      console.error('❌ Error adding role to user:', error);
      throw error;
    }
  }

  async removeRoleFromUser(email: string, roleName: string) {
    try {
      console.log('➖ Removing role from user:', email);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          userRoles: {
            include: { role: true },
            where: { isActive: true }
          }
        }
      });

      if (!user) {
        console.log('❌ User not found:', email);
        return null;
      }

      // Find the specific user role
      const userRole = user.userRoles.find(ur => ur.role.name === roleName);
      if (!userRole) {
        console.log('⚠️  User does not have role:', roleName);
        return user;
      }

      // Deactivate the role
      await prisma.userRole.update({
        where: { id: userRole.id },
        data: {
          isActive: false
        }
      });

      // Update admin status if removing admin role
      if (roleName === 'admin') {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: false }
        });
      }

      console.log('✅ Role removed successfully!');
      console.log('👤 User:', user.email);
      console.log('➖ Removed role:', roleName);

      return user;

    } catch (error) {
      console.error('❌ Error removing role from user:', error);
      throw error;
    }
  }

  async listUserRoles(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          userRoles: {
            include: { role: true },
            where: { isActive: true }
          }
        }
      });

      if (!user) {
        console.log('❌ User not found:', email);
        return;
      }

      console.log('\n👤 User Roles for:', email);
      console.log('='.repeat(50));
      console.log('👤 Name:', `${user.firstName} ${user.lastName}`);
      console.log('✔️  Verified:', user.isVerified);
      console.log('👑 Admin:', user.isAdmin);
      console.log('🏷️  Roles:', user.userRoles.map(ur => ur.role.name).join(', ') || 'No active roles');
      console.log('='.repeat(50));

    } catch (error) {
      console.error('❌ Error listing user roles:', error);
    }
  }

  async listRoles() {
    try {
      const roles = await prisma.role.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      console.log('\n🏷️  Available Roles:');
      console.log('='.repeat(50));
      roles.forEach(role => {
        console.log(`• ${role.name.padEnd(20)} - ${role.description}`);
      });
      console.log('='.repeat(50));

    } catch (error) {
      console.error('❌ Error listing roles:', error);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('InmoTech User Role Management');
    console.log('============================\n');
    console.log('Usage:');
    console.log('  npm run change-role <email> <newRole>        # Replace user role');
    console.log('  npm run change-role --add <email> <role>     # Add role to user');
    console.log('  npm run change-role --remove <email> <role>  # Remove role from user');
    console.log('  npm run change-role --show <email>           # Show user roles');
    console.log('  npm run change-role --list-roles             # List all available roles');
    console.log('\nExamples:');
    console.log('  npm run change-role admin@inmotech.com admin');
    console.log('  npm run change-role --add user@example.com property_manager');
    console.log('  npm run change-role --remove user@example.com investor');
    console.log('  npm run change-role --show admin@inmotech.com');
    return;
  }

  const roleManager = new RoleManager();

  try {
    if (args[0] === '--list-roles') {
      await roleManager.listRoles();
      return;
    }

    if (args[0] === '--show' && args[1]) {
      await roleManager.listUserRoles(args[1]);
      return;
    }

    if (args[0] === '--add' && args[1] && args[2]) {
      await roleManager.addRoleToUser(args[1], args[2]);
      return;
    }

    if (args[0] === '--remove' && args[1] && args[2]) {
      await roleManager.removeRoleFromUser(args[1], args[2]);
      return;
    }

    if (args.length < 2) {
      console.log('❌ Error: Missing required arguments');
      console.log('Usage: npm run change-role <email> <newRole>');
      console.log('Run "npm run change-role --help" for more information');
      process.exit(1);
    }

    const [email, newRole] = args;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Error: Invalid email format');
      process.exit(1);
    }

    await roleManager.changeUserRole(email, newRole);

  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { RoleManager };