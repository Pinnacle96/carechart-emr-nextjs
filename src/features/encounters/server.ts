import type { PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/api";
import { getDemoSession } from "@/lib/db/session";
import { encounterDraftSchema, getCompletionErrors, type EncounterDraftInput } from "@/lib/validation/encounter";

export async function createEncounter(
  client: PrismaClient,
  input: { patientId: string; appointmentId?: string | null },
) {
  const session = await getDemoSession(client);
  const patient = await client.patient.findFirst({ where: { id: input.patientId, demoSessionId: session.id } });
  if (!patient) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient was not found in this demo.");

  if (input.appointmentId) {
    const appointment = await client.appointment.findFirst({
      where: { id: input.appointmentId, patientId: patient.id, demoSessionId: session.id },
      include: { encounter: true },
    });
    if (!appointment) throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Appointment was not found for this patient.");
    if (appointment.status === "CANCELLED") throw new AppError(409, "APPOINTMENT_CANCELLED", "A cancelled appointment cannot be started.");
    if (appointment.encounter) return appointment.encounter;
    return client.encounter.create({
      data: {
        demoSessionId: session.id,
        patientId: patient.id,
        appointmentId: appointment.id,
        visitReason: appointment.visitReason,
      },
    });
  }

  return client.encounter.create({ data: { demoSessionId: session.id, patientId: patient.id } });
}

export async function saveEncounterDraft(
  client: PrismaClient,
  encounterId: string,
  expectedPatientId: string,
  raw: EncounterDraftInput,
) {
  const input = encounterDraftSchema.parse(raw);
  const session = await getDemoSession(client);

  return client.$transaction(async (tx) => {
    const existing = await tx.encounter.findFirst({
      where: { id: encounterId, patientId: expectedPatientId, demoSessionId: session.id },
      include: { orders: true },
    });
    if (!existing) throw new AppError(404, "ENCOUNTER_NOT_FOUND", "Encounter was not found for this patient.");
    if (existing.status === "COMPLETED") throw new AppError(409, "ENCOUNTER_COMPLETED", "Completed encounters are read-only.");
    if (existing.revision !== input.revision) {
      throw new AppError(409, "REVISION_CONFLICT", "This encounter has a newer saved revision.", {
        currentRevision: existing.revision,
        serverEncounter: existing,
      });
    }

    const changed = await tx.encounter.updateMany({
      where: { id: encounterId, patientId: expectedPatientId, status: "DRAFT", revision: input.revision },
      data: {
        visitReason: input.visitReason,
        bloodPressure: input.bloodPressure || null,
        heartRate: input.heartRate,
        temperature: input.temperature,
        respiratoryRate: input.respiratoryRate,
        oxygenSaturation: input.oxygenSaturation,
        weight: input.weight,
        height: input.height,
        subjective: input.subjective,
        objective: input.objective,
        assessment: input.assessment,
        plan: input.plan,
        revision: { increment: 1 },
      },
    });
    if (changed.count !== 1) {
      const latest = await tx.encounter.findUnique({ where: { id: encounterId }, include: { orders: true } });
      throw new AppError(409, "REVISION_CONFLICT", "This encounter changed while it was being saved.", {
        currentRevision: latest?.revision,
        serverEncounter: latest,
      });
    }
    await tx.encounterOrder.deleteMany({ where: { encounterId } });
    if (input.orders.length) {
      await tx.encounterOrder.createMany({
        data: input.orders.map((order) => ({
          encounterId,
          type: order.type,
          catalogKey: order.catalogKey,
          itemName: order.itemName,
          instructions: order.instructions || null,
          status: "DRAFT",
        })),
      });
    }
    return tx.encounter.findUniqueOrThrow({ where: { id: encounterId }, include: { orders: true } });
  });
}

export async function completeEncounter(
  client: PrismaClient,
  encounterId: string,
  expectedPatientId: string,
  revision: number,
) {
  const session = await getDemoSession(client);
  return client.$transaction(async (tx) => {
    const encounter = await tx.encounter.findFirst({
      where: { id: encounterId, patientId: expectedPatientId, demoSessionId: session.id },
      include: { orders: true },
    });
    if (!encounter) throw new AppError(404, "ENCOUNTER_NOT_FOUND", "Encounter was not found for this patient.");
    if (encounter.status === "COMPLETED") return encounter;
    if (encounter.revision !== revision) {
      throw new AppError(409, "REVISION_CONFLICT", "Save or resolve the newer revision before completing.", {
        currentRevision: encounter.revision,
      });
    }
    const completionErrors = getCompletionErrors(encounter);
    if (completionErrors.length) {
      throw new AppError(422, "COMPLETION_REQUIREMENTS", "Complete the required encounter fields.", completionErrors);
    }

    const completedAt = new Date();
    const changed = await tx.encounter.updateMany({
      where: { id: encounterId, status: "DRAFT", revision },
      data: { status: "COMPLETED", completedAt },
    });
    if (changed.count !== 1) throw new AppError(409, "REVISION_CONFLICT", "The encounter changed before completion.");
    await tx.encounterOrder.updateMany({ where: { encounterId }, data: { status: "ORDERED" } });
    if (encounter.appointmentId) {
      await tx.appointment.update({ where: { id: encounter.appointmentId }, data: { status: "COMPLETED" } });
    }
    return tx.encounter.findUniqueOrThrow({ where: { id: encounterId }, include: { orders: true } });
  });
}
