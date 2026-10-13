import type { Prisma, PrismaClient } from "@prisma/client";
import { LOCAL_DEMO_SESSION_KEY } from "@/lib/constants";
import { AppError } from "@/lib/api";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function getDemoSession(client: DbClient) {
  const session = await client.demoSession.findUnique({ where: { sessionKey: LOCAL_DEMO_SESSION_KEY } });
  if (!session) throw new AppError(503, "DEMO_NOT_INITIALIZED", "Demo data is not initialized. Run the database seed command.");
  return session;
}
