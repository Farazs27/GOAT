import { PrismaClient } from '@prisma/client';

/**
 * Creates a tenant-aware Prisma client extension that sets the current practice_id
 * for Row-Level Security (RLS) policies.
 */
export function createTenantPrisma(practiceId: string) {
  const prisma = new PrismaClient();
  
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        return prisma.$transaction(async (tx) => {
          // Set the tenant context for RLS
          await tx.$executeRaw`SELECT set_config('app.current_practice_id', ${practiceId}, true)`;
          
          // Execute the original query
          const result = await query(args);
          return result;
        });
      },
    },
  });
}
