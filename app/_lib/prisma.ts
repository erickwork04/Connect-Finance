import { PrismaClient } from "@prisma/client";

const sanitizeUrl = (url?: string) => {
  if (!url) return url;
  return url.trim().replace(/^["']|["']$/g, "").trim();
};

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = sanitizeUrl(process.env.DATABASE_URL);
}

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  const url = sanitizeUrl(process.env.DATABASE_URL);
  return new PrismaClient(
    url
      ? {
          datasources: {
            db: {
              url,
            },
          },
        }
      : undefined,
  );
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = createPrismaClient();
  }
  prisma = global.cachedPrisma;
}

export const db = prisma;
