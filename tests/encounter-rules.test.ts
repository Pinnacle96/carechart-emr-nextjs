import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/api";
import { resetDemoData } from "@/lib/db/seed-data";
import { completeEncounter, createEncounter, saveEncounterDraft } from "@/features/encounters/server";

const client = new PrismaClient();
let patients: Array<{ id: string }> = [];

const draft = (revision: number, overrides = {}) => ({
  revision, visitReason: "Demo follow-up", bloodPressure: "120/80", heartRate: 70, temperature: 36.8,
  respiratoryRate: 16, oxygenSaturation: 98, weight: 65, height: 170,
  subjective: "Fictional subjective note", objective: "Fictional objective note", assessment: "Fictional assessment", plan: "Fictional plan", orders: [], ...overrides,
});

beforeAll(async () => { await resetDemoData(client); patients = await client.patient.findMany({ orderBy: { medicalRecordNumber: "asc" }, take: 3, select: { id: true } }); });
afterAll(async () => { await client.$disconnect(); });

describe("encounter persistence and completion rules", () => {
  it("increments revisions and rejects a stale save without overwriting newer data", async () => {
    const encounter = await createEncounter(client, { patientId: patients[2].id });
    const saved = await saveEncounterDraft(client, encounter.id, patients[2].id, draft(0));
    expect(saved.revision).toBe(1);
    await expect(saveEncounterDraft(client, encounter.id, patients[2].id, draft(0, { visitReason: "Stale overwrite" }))).rejects.toMatchObject({ code: "REVISION_CONFLICT", status: 409 });
    const current = await client.encounter.findUniqueOrThrow({ where: { id: encounter.id } });
    expect(current.visitReason).toBe("Demo follow-up");
  });

  it("preserves patient ownership checks", async () => {
    const encounter = await createEncounter(client, { patientId: patients[2].id });
    await expect(saveEncounterDraft(client, encounter.id, patients[1].id, draft(0))).rejects.toMatchObject({ code: "ENCOUNTER_NOT_FOUND", status: 404 });
  });

  it("rejects completion when required fields are missing", async () => {
    const encounter = await createEncounter(client, { patientId: patients[2].id });
    try { await completeEncounter(client, encounter.id, patients[2].id, 0); throw new Error("Expected completion to fail"); }
    catch (error) { expect(error).toBeInstanceOf(AppError); expect(error).toMatchObject({ code: "COMPLETION_REQUIREMENTS", status: 422 }); }
  });

  it("completes the encounter and linked appointment transactionally and is idempotent", async () => {
    const appointment = await client.appointment.findFirstOrThrow({ where: { status: "SCHEDULED", encounter: null } });
    const encounter = await createEncounter(client, { patientId: appointment.patientId, appointmentId: appointment.id });
    const saved = await saveEncounterDraft(client, encounter.id, appointment.patientId, draft(0, { orders: [{ type: "LAB", catalogKey: "demo-lab-panel", itemName: "Demo wellness panel", instructions: "" }] }));
    const completed = await completeEncounter(client, encounter.id, appointment.patientId, saved.revision);
    const repeated = await completeEncounter(client, encounter.id, appointment.patientId, saved.revision);
    const refreshedAppointment = await client.appointment.findUniqueOrThrow({ where: { id: appointment.id } });
    const order = await client.encounterOrder.findFirstOrThrow({ where: { encounterId: encounter.id } });
    expect(completed.status).toBe("COMPLETED");
    expect(repeated.status).toBe("COMPLETED");
    expect(refreshedAppointment.status).toBe("COMPLETED");
    expect(order.status).toBe("ORDERED");
  });

  it("rejects edits to completed encounters", async () => {
    const completed = await client.encounter.findFirstOrThrow({ where: { status: "COMPLETED" } });
    await expect(saveEncounterDraft(client, completed.id, completed.patientId, draft(completed.revision))).rejects.toMatchObject({ code: "ENCOUNTER_COMPLETED", status: 409 });
  });
});
