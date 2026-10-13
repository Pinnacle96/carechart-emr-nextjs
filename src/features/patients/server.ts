import { randomInt } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { PATIENTS_PER_PAGE } from "@/lib/constants";
import { getDemoSession } from "@/lib/db/session";
import { patientRegistrationSchema, type PatientRegistrationInput } from "@/lib/validation/patient";

export function normalizePatientDirectoryParams(params: { q?: string; status?: string; page?: string | number }) {
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const status = params.status === "ACTIVE" || params.status === "INACTIVE" ? params.status : "ALL";
  const parsedPage = Number(params.page ?? 1);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  return { q, status, page } as const;
}

export async function listPatients(client: PrismaClient, raw: { q?: string; status?: string; page?: string | number }) {
  const session = await getDemoSession(client);
  const params = normalizePatientDirectoryParams(raw);
  const where = {
    demoSessionId: session.id,
    ...(params.status === "ALL" ? {} : { status: params.status }),
    ...(params.q
      ? {
          OR: [
            { firstName: { contains: params.q } },
            { lastName: { contains: params.q } },
            { medicalRecordNumber: { contains: params.q } },
          ],
        }
      : {}),
  };
  const total = await client.patient.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PATIENTS_PER_PAGE));
  const page = Math.min(params.page, pageCount);
  const patients = await client.patient.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    skip: (page - 1) * PATIENTS_PER_PAGE,
    take: PATIENTS_PER_PAGE,
    include: {
      encounters: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { completedAt: true },
      },
    },
  });
  return { patients, total, page, pageCount, params: { ...params, page } };
}

export async function registerPatient(client: PrismaClient, raw: PatientRegistrationInput) {
  const input = patientRegistrationSchema.parse(raw);
  const session = await getDemoSession(client);
  let medicalRecordNumber = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    medicalRecordNumber = `CC-${new Date().getUTCFullYear()}-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
    const exists = await client.patient.count({ where: { medicalRecordNumber } });
    if (!exists) break;
  }
  return client.patient.create({
    data: {
      demoSessionId: session.id,
      medicalRecordNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: new Date(`${input.dateOfBirth}T12:00:00Z`),
      sex: input.sex || null,
      email: input.email || null,
      phone: input.phone || null,
      emergencyName: input.emergencyName || null,
      emergencyPhone: input.emergencyPhone || null,
      allergyStatus: "NOT_RECORDED",
    },
  });
}
