// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeEncounter, makeSeedData, readDemo, registerPatient, resetDemo, saveEncounterDraft, setAppointmentStatus, startEncounter } from "@/lib/browser-demo";
import { listPatientsFromDemo } from "@/lib/patient-directory";

const draft = (revision: number, overrides = {}) => ({
  revision, visitReason: "Demo follow-up", bloodPressure: "120/80", heartRate: 70, temperature: 36.8,
  respiratoryRate: 16, oxygenSaturation: 98, weight: 65, height: 170,
  subjective: "Fictional subjective note", objective: "Fictional objective note",
  assessment: "Fictional assessment", plan: "Fictional plan", orders: [], ...overrides,
});

beforeEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });

describe("browser-tab demo", () => {
  it("starts with 30 fictional records and repeatable directory search, status, and pagination", () => {
    const state = makeSeedData(new Date("2026-10-13T12:00:00Z"));
    expect(state.patients).toHaveLength(30);
    expect(state.appointments).toHaveLength(12);
    expect(listPatientsFromDemo(state, { q: " Amara " }).patients[0].lastName).toBe("Dovetail");
    expect(listPatientsFromDemo(state, { q: "CC-000001" }).total).toBe(1);
    expect(listPatientsFromDemo(state, { status: "INACTIVE" }).total).toBe(1);
    expect(listPatientsFromDemo(state, { page: "2" }).patients).toHaveLength(10);
    expect(listPatientsFromDemo(state, { page: "-3", status: "INVALID" }).params).toEqual({ q: "", status: "ALL", page: 1 });
  });

  it("registers a patient with a unique MRN and resets only stored demo data", () => {
    const patient = registerPatient({ firstName: "Nova", lastName: "Storybook", dateOfBirth: "1991-05-07" });
    expect(patient.medicalRecordNumber).toBe("CC-000031");
    expect(readDemo().patients).toHaveLength(31);
    expect(resetDemo().patients).toHaveLength(30);
    expect(readDemo().patients.some((item) => item.id === patient.id)).toBe(false);
  });

  it("rejects stale writes and wrong-patient access without losing the latest draft", () => {
    const state = readDemo();
    const owner = state.patients[2].id;
    const other = state.patients[3].id;
    const encounter = startEncounter(owner);
    const saved = saveEncounterDraft(encounter.id, owner, draft(0));
    expect(saved.revision).toBe(1);
    expect(() => saveEncounterDraft(encounter.id, owner, draft(0, { visitReason: "Stale overwrite" }))).toThrowError(expect.objectContaining({ code: "REVISION_CONFLICT" }));
    expect(() => saveEncounterDraft(encounter.id, other, draft(1))).toThrowError(expect.objectContaining({ code: "ENCOUNTER_NOT_FOUND" }));
    expect(readDemo().encounters.find((item) => item.id === encounter.id)?.visitReason).toBe("Demo follow-up");
  });

  it("enforces completion requirements, marks linked appointments and orders, and rejects later edits", () => {
    const appointment = readDemo().appointments.find((item) => item.status === "SCHEDULED")!;
    const encounter = startEncounter(appointment.patientId, appointment.id);
    expect(() => completeEncounter(encounter.id, appointment.patientId, 0)).toThrowError(expect.objectContaining({ code: "COMPLETION_REQUIREMENTS" }));
    const saved = saveEncounterDraft(encounter.id, appointment.patientId, draft(0, { orders: [{ type: "LAB", catalogKey: "demo-lab-panel", itemName: "Demo wellness panel", instructions: "" }] }));
    const completed = completeEncounter(encounter.id, appointment.patientId, saved.revision);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.orders[0].status).toBe("ORDERED");
    expect(readDemo().appointments.find((item) => item.id === appointment.id)?.status).toBe("COMPLETED");
    expect(completeEncounter(encounter.id, appointment.patientId, saved.revision).status).toBe("COMPLETED");
    expect(() => saveEncounterDraft(encounter.id, appointment.patientId, draft(saved.revision))).toThrowError(expect.objectContaining({ code: "ENCOUNTER_COMPLETED" }));
    expect(() => setAppointmentStatus(appointment.id, "SCHEDULED")).toThrowError(expect.objectContaining({ code: "APPOINTMENT_COMPLETED" }));
  });

  it("preserves the last saved revision when browser storage rejects a write", () => {
    const patientId = readDemo().patients[2].id;
    const encounter = startEncounter(patientId);
    const actual = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new DOMException("Full", "QuotaExceededError"); });
    expect(() => saveEncounterDraft(encounter.id, patientId, draft(0))).toThrowError(expect.objectContaining({ code: "STORAGE_UNAVAILABLE" }));
    vi.mocked(Storage.prototype.setItem).mockRestore();
    expect(readDemo().encounters.find((item) => item.id === encounter.id)?.revision).toBe(0);
    expect(saveEncounterDraft(encounter.id, patientId, draft(0)).revision).toBe(1);
    expect(actual).toBeDefined();
  });
});
