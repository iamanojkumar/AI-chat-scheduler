import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Get DATABASE_URL and ensure it has pgbouncer=true for pooler connections
let databaseUrl = process.env.DATABASE_URL || "";
if (databaseUrl.includes("pooler") && !databaseUrl.includes("pgbouncer=true")) {
  // Add pgbouncer=true parameter if using pooler
  databaseUrl += (databaseUrl.includes("?") ? "&" : "?") + "pgbouncer=true";
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

