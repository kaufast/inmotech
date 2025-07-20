// Mock Prisma client for build without DATABASE_URL
let prisma: any;

if (process.env.DATABASE_URL) {
  // Only import and use real Prisma if DATABASE_URL exists
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const globalForPrisma = globalThis as unknown as {
      prisma: any | undefined;
    };

    prisma = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  } catch (error) {
    console.warn('Prisma client not available, using mock');
    prisma = createMockPrisma();
  }
} else {
  // Use mock Prisma for build process
  console.warn('DATABASE_URL not found, using mock Prisma client');
  prisma = createMockPrisma();
}

function createMockPrisma() {
  return {
    user: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
    },
    project: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
    },
    investment: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
    },
    payment: {
      findFirst: () => Promise.resolve(null),
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
    },
    escrowAccount: {
      findFirst: () => Promise.resolve(null),
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
    },
    escrowEntry: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
    },
    userFavorite: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
      count: () => Promise.resolve(0),
    },
    auditLog: {
      create: () => Promise.resolve({}),
    },
    notification: {
      create: () => Promise.resolve({}),
    },
    $disconnect: () => Promise.resolve(),
  };
}

export { prisma };
export default prisma;