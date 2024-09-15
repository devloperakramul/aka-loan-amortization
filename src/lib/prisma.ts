// // lib/prisma.ts
// import { PrismaClient } from '@prisma/client';

// declare global {
//     // Prevent multiple instances of Prisma Client in development
//     let prisma: PrismaClient | undefined;
// }

// // Use let in global scope instead of var
// // export const prisma = global.prisma || new PrismaClient();
// export const prisma = globalThis.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== 'production') {
//     globalThis.prisma = prisma;
// }


import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma