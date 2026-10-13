import { PrismaClient } from "@prisma/client";
import { resetDemoData } from "../src/lib/db/seed-data";

const client = new PrismaClient();

try {
  const result = await resetDemoData(client);
  console.log(`Reset complete. Restored ${result.patientCount} fictional patients.`);
} finally {
  await client.$disconnect();
}
