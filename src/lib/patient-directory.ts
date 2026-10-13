import type { DemoState } from "@/lib/browser-demo";
import { PATIENTS_PER_PAGE } from "@/lib/constants";

export function listPatientsFromDemo(state: DemoState, raw: { q?: string | null; status?: string | null; page?: string | null }) {
  const q = (raw.q ?? "").trim().slice(0, 80);
  const status = raw.status === "ACTIVE" || raw.status === "INACTIVE" ? raw.status : "ALL";
  const requestedPage = Number(raw.page ?? 1);
  const filtered = state.patients.filter((patient) =>
    (status === "ALL" || patient.status === status) &&
    (!q || `${patient.firstName} ${patient.lastName} ${patient.medicalRecordNumber}`.toLowerCase().includes(q.toLowerCase())),
  ).sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PATIENTS_PER_PAGE));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pageCount) : 1;
  const patients = filtered.slice((page - 1) * PATIENTS_PER_PAGE, page * PATIENTS_PER_PAGE).map((patient) => ({
    ...patient,
    encounters: state.encounters.filter((encounter) => encounter.patientId === patient.id && encounter.status === "COMPLETED")
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")).slice(0, 1),
  }));
  return { patients, total: filtered.length, page, pageCount, params: { q, status, page } };
}
