#!/usr/bin/env tsx

/**
 * User Management Script - Add User with Role
 * Usage: npm run add-user <email> <password> <firstName> <lastName> [role]
 */

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

interface CreateUserOptions {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleName?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
}

class UserManager {
  async createUser(options: CreateUserOptions) {
    const {
      email,
      password,
      firstName,
      lastName,
      roleName = 'investor',
      isVerified = true,
      isAdmin = false
    } = options;

    try {
      console.log('👤 Creating user:', email);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        console.log('❌ User already exists with email:', email);
        return null;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Find or create the role
      let role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        console.log(`📝 Creating role: ${roleName}`);
        role = await prisma.role.create({
          data: {
            name: roleName,
            description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`,
            isActive: true
          }
        });
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          isVerified,
          isAdmin,
          kycStatus: 'PENDING'
        }
      });

      // Assign role to user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          isActive: true
        }
      });

      console.log('✅ User created successfully!');
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', `${user.firstName} ${user.lastName}`);
      console.log('🏷️  Role:', roleName);
      console.log('✔️  Verified:', user.isVerified);
      console.log('👑 Admin:', user.isAdmin);

      return user;

    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async listUsers() {
    try {
      const users = await prisma.user.findMany({
        include: {
          userRoles: {
            include: {
              role: true
            },
            where: {
              isActive: true
            }
          }
        }
      });

      console.log('\n👥 Current Users:');
      console.log('='.repeat(80));
      
      users.forEach(user => {
        const roles = user.userRoles.map(ur => ur.role.name).join(', ');
        console.log(`📧 ${user.email.padEnd(30)} | 👤 ${(user.firstName + ' ' + user.lastName).padEnd(25)} | 🏷️  ${roles}`);
      });
      
      console.log('='.repeat(80));
      console.log(`Total users: ${users.length}`);

    } catch (error) {
      console.error('❌ Error listing users:', error);
    }
  }

  async createDefaultRoles() {
    const defaultRoles = [
      { name: 'admin', description: 'System administrator with full access' },
      { name: 'investor', description: 'Regular investor user' },
      { name: 'property_manager', description: 'Property management role' },
      { name: 'analyst', description: 'Financial analyst role' },
      { name: 'support', description: 'Customer support role' }
    ];

    console.log('🏷️  Creating default roles...');

    for (const roleData of defaultRoles) {
      try {
        const existingRole = await prisma.role.findUnique({
          where: { name: roleData.name }
        });

        if (!existingRole) {
          await prisma.role.create({
            data: {
              ...roleData,
              isActive: true
            }
          });
          console.log(`✅ Created role: ${roleData.name}`);
        } else {
          console.log(`⏭️  Role already exists: ${roleData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error creating role ${roleData.name}:`, error);
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('InmoTech User Management - Add User');
    console.log('=====================================\n');
    console.log('Usage:');
    console.log('  npm run add-user <email> <password> <firstName> <lastName> [role]');
    console.log('  npm run add-user --list');
    console.log('  npm run add-user --setup-roles');
    console.log('\nExamples:');
    console.log('  npm run add-user admin@inmotech.com password123 John Doe admin');
    console.log('  npm run add-user investor@example.com pass123 Jane Smith investor');
    console.log('  npm run add-user --list');
    console.log('\nAvailable roles: admin, investor, property_manager, analyst, support');
    return;
  }

  const userManager = new UserManager();

  try {
    if (args[0] === '--list') {
      await userManager.listUsers();
      return;
    }

    if (args[0] === '--setup-roles') {
      await userManager.createDefaultRoles();
      return;
    }

    if (args.length < 4 && !args[0]?.startsWith('--')) {
      console.log('❌ Error: Missing required arguments');
      console.log('Usage: npm run add-user <email> <password> <firstName> <lastName> [role]');
      console.log('Run "npm run add-user --help" for more information');
      process.exit(1);
    }

    const [email, password, firstName, lastName, roleName] = args;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Error: Invalid email format');
      process.exit(1);
    }

    // Validate password length
    if (password.length < 6) {
      console.log('❌ Error: Password must be at least 6 characters');
      process.exit(1);
    }

    await userManager.createUser({
      email,
      password,
      firstName,
      lastName,
      roleName,
      isAdmin: roleName === 'admin'
    });

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

export { UserManager };