import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { verifyPassword, createSecureJWT } from '../src/lib/edge-crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testUserLogin(email: string, password: string) {
  console.log(`\n🧪 Testing login for: ${email}`);
  console.log('='.repeat(50));
  
  try {
    // Get user from database
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
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Account Active: ${user.isActive}`);
    console.log(`   Verified: ${user.isVerified}`);
    console.log(`   Admin: ${user.isAdmin}`);

    // Test password verification
    const isPasswordValid = await verifyPassword(password, user.password);
    console.log(`   Password Valid: ${isPasswordValid ? '✅' : '❌'}`);

    if (!isPasswordValid) {
      console.log('❌ Login would fail due to invalid password');
      return;
    }

    // Display roles and permissions
    console.log(`\n🎭 User Roles (${user.userRoles.length}):`);
    const userRoles: string[] = [];
    const allPermissions: string[] = [];

    user.userRoles.forEach(userRole => {
      console.log(`   - ${userRole.role.name}`);
      console.log(`     Description: ${userRole.role.description || 'N/A'}`);
      
      userRoles.push(userRole.role.name);
      
      const permissions = userRole.role.rolePermissions.map(rp => rp.permission.name);
      allPermissions.push(...permissions);
      
      console.log(`     Permissions (${permissions.length}):`);
      permissions.forEach(permission => {
        console.log(`       • ${permission}`);
      });
      console.log('');
    });

    // Test JWT creation
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      roles: userRoles,
      permissions: Array.from(new Set(allPermissions)) // Remove duplicates
    };

    try {
      const token = await createSecureJWT(jwtPayload, '7d');
      console.log('🔐 JWT Token created successfully');
      console.log(`   Payload: ${JSON.stringify(jwtPayload, null, 2)}`);
    } catch (error) {
      console.log('❌ JWT Token creation failed:', error);
    }

    console.log('\n✅ Login test completed successfully!');

  } catch (error) {
    console.error('❌ Error during login test:', error);
  }
}

async function testRBACScenarios() {
  console.log('🚀 RBAC System Test Suite');
  console.log('========================\n');

  // Test different user types
  const testScenarios = [
    { email: 'test@example.com', password: 'password123', expectedRole: 'property_manager' },
    { email: 'kennethmelchor@gmail.com', password: 'password123', expectedRole: 'analyst' },
    { email: 'user@test.com', password: 'password123', expectedRole: 'investor' },
    { email: 'admin@inmote.ch', password: 'admin123', expectedRole: 'admin' }
  ];

  for (const scenario of testScenarios) {
    await testUserLogin(scenario.email, scenario.password);
    console.log('\n' + '='.repeat(70));
  }

  console.log('\n🎯 RBAC Permission Matrix:');
  console.log('==========================');
  
  // Test permission matrix
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: {
          permission: true
        }
      }
    }
  });

  roles.forEach(role => {
    console.log(`\n📋 ${role.name.toUpperCase()}`);
    console.log(`   ${role.description}`);
    console.log('   Permissions:');
    
    const permissionsByResource: { [key: string]: string[] } = {};
    
    role.rolePermissions.forEach(rp => {
      const permission = rp.permission;
      if (!permissionsByResource[permission.resource]) {
        permissionsByResource[permission.resource] = [];
      }
      permissionsByResource[permission.resource].push(permission.action);
    });

    Object.keys(permissionsByResource).sort().forEach(resource => {
      const actions = permissionsByResource[resource].sort();
      console.log(`     ${resource}: ${actions.join(', ')}`);
    });
  });
}

async function main() {
  try {
    await testRBACScenarios();
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}