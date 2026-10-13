import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { listPatients, normalizePatientDirectoryParams } from "@/features/patients/server";
import { resetDemoData } from "@/lib/db/seed-data";

const client = new PrismaClient();

beforeAll(async () => { await resetDemoData(client); });
afterAll(async () => { await client.$disconnect(); });

describe("patient directory search and pagination", () => {
  it("normalizes invalid URL parameters", () => {
    expect(normalizePatientDirectoryParams({ q: "  Amara ", page: "-5", status: "UNKNOWN" })).toEqual({ q: "Amara", page: 1, status: "ALL" });
  });

  it("searches fictional names and record numbers", async () => {
    const byName = await listPatients(client, { q: "Amara" });
    const byMrn = await listPatients(client, { q: "CC-000001" });
    expect(byName.total).toBe(1);
    expect(byName.patients[0].lastName).toBe("Dovetail");
    expect(byMrn.patients[0].firstName).toBe("Amara");
  });

  it("paginates and applies the status filter", async () => {
    const secondPage = await listPatients(client, { page: "2" });
    const inactive = await listPatients(client, { status: "INACTIVE" });
    expect(secondPage.page).toBe(2);
    expect(secondPage.patients).toHaveLength(10);
    expect(inactive.patients).toHaveLength(1);
    expect(inactive.patients[0].status).toBe("INACTIVE");
  });
});
