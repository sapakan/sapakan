import { Prisma, PrismaClient } from "@prisma/client";

function getPrismaConfig(): Prisma.PrismaClientOptions {
  switch (process.env.NODE_ENV) {
    case "test":
      return {
        log: ["error", "info", "warn"],
      };
    default:
      return {
        log: ["query", "error", "info", "warn"],
      };
  }
}

const prisma = new PrismaClient(getPrismaConfig());
export default prisma;

export * from "@prisma/client";
