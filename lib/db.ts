import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // Default pg.Pool max (10) is tight under concurrent request bursts (e.g.
  // parallel E2E workers each doing several sequential queries per request);
  // raise it so legitimate concurrent traffic queues for connections less.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 20 });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
