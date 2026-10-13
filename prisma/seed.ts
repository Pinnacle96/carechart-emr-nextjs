import { PrismaClient } from "@prisma/client";
import { resetDemoData } from "../src/lib/db/seed-data";

const client = new PrismaClient();

try {
  const result = await resetDemoData(client);
  console.log(`Seeded ${result.patientCount} fictional patients for the local CareChart demo.`);
} finally {
  await client.$disconnect();
}
