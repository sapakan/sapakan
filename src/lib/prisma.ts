import { Prisma, PrismaClient } from "@prisma/client";

function getPrismaConfig(): Prisma.PrismaClientOptions {
  switch (process.env.NODE_ENV) {
    case "test":
      return {
        log: ["query", "info", "warn"],
      };
    default:
      return {
        log: ["info", "query", "info", "warn"],
      };
  }
}

const prisma = new PrismaClient(getPrismaConfig());
export default prisma;

export * from "@prisma/client";
