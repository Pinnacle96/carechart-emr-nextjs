"use client";

import { addDays, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import { useEffect, useState } from "react";
import { getCompletionErrors, encounterDraftSchema, type EncounterDraftInput } from "@/lib/validation/encounter";
import { patientRegistrationSchema, type PatientRegistrationInput } from "@/lib/validation/patient";
import { appointmentStatusSchema } from "@/lib/validation/appointment";

export type Patient = {
  id: string; medicalRecordNumber: string; firstName: string; lastName: string;
  dateOfBirth: string; sex: string | null; email: string | null; phone: string | null;
  emergencyName: string | null; emergencyPhone: string | null;
  status: "ACTIVE" | "INACTIVE"; allergyStatus: "KNOWN" | "NONE_KNOWN" | "NOT_RECORDED";
  allergies: { id: string; name: string; reaction: string | null }[];
  conditions: { id: string; name: string; status: string }[];
  medications: { id: string; name: string; details: string | null; status: string }[];
  createdAt: string;
};
export type AppointmentStatus = "SCHEDULED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
export type Appointment = { id: string; patientId: string; startsAt: string; visitReason: string; status: AppointmentStatus };
export type EncounterOrder = { id: string; type: "MEDICATION" | "LAB"; catalogKey: string; itemName: string; instructions: string; status: "DRAFT" | "ORDERED" };
export type Encounter = Omit<EncounterDraftInput, "orders"> & {
  id: string; patientId: string; appointmentId: string | null; status: "DRAFT" | "COMPLETED";
  createdAt: string; updatedAt: string; completedAt: string | null; orders: EncounterOrder[];
};
export type DemoState = { version: 1; nextMrn: number; patients: Patient[]; appointments: Appointment[]; encounters: Encounter[] };

const STORAGE_KEY = "carechart:fictional-demo:v1";
const CHANGE_EVENT = "carechart:demo-changed";
const people = [
  ["Amara", "Dovetail"], ["Jonah", "Northstar"], ["Lena", "Marigold"], ["Theo", "Evergreen"],
  ["Maya", "Silverleaf"], ["Ezra", "Bluehaven"], ["Nia", "Westbrook"], ["Owen", "Fairlight"],
  ["Iris", "Meadoway"], ["Caleb", "Brighton"], ["Zara", "Pinecrest"], ["Miles", "Cloudwell"],
  ["Asha", "Redfern"], ["Felix", "Oakmere"], ["Lila", "Sunfield"], ["Micah", "Riverstone"],
  ["Sana", "Willowby"], ["Eli", "Frostvale"], ["Ada", "Clearwater"], ["Noel", "Rosebank"],
  ["Talia", "Greenmoor"], ["Isaac", "Harborlight"], ["Mira", "Ashgrove"], ["Levi", "Springpath"],
  ["Kemi", "Cedarline"], ["Hugo", "Mapleford"], ["Rina", "Goldcrest"], ["Sam", "Hillgarden"],
  ["Yara", "Brookfield"], ["Joel", "Starling"],
] as const;
const reasons = ["Routine follow-up", "Review of recent symptoms", "Annual wellness visit", "Medication history review"];

export class DemoError extends Error {
  constructor(public code: string, message: string, public details?: Record<string, unknown>) { super(message); }
}

function blankEncounter(patientId: string, appointmentId: string | null, visitReason = ""): Encounter {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), patientId, appointmentId, status: "DRAFT", revision: 0,
    visitReason, bloodPressure: "", heartRate: null, temperature: null, respiratoryRate: null,
    oxygenSaturation: null, weight: null, height: null, subjective: "", objective: "", assessment: "", plan: "",
    orders: [], createdAt: now, updatedAt: now, completedAt: null };
}

export function makeSeedData(now = new Date()): DemoState {
  const patients: Patient[] = people.map(([firstName, lastName], index) => {
    const allergyStatus = index % 3 === 0 ? "KNOWN" : index % 3 === 1 ? "NONE_KNOWN" : "NOT_RECORDED";
    return {
      id: `seed-patient-${index + 1}`, medicalRecordNumber: `CC-${String(index + 1).padStart(6, "0")}`,
      firstName, lastName, dateOfBirth: new Date(Date.UTC(1948 + ((index * 7) % 62), (index * 3) % 12, 2 + (index % 25), 12)).toISOString(),
      sex: index % 4 === 3 ? null : index % 2 === 0 ? "Female" : "Male",
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: index % 5 === 0 ? null : `+1 555 01${String(index).padStart(2, "0")}`,
      emergencyName: index % 4 === 0 ? `Demo Contact ${index + 1}` : null,
      emergencyPhone: index % 4 === 0 ? `+1 555 90${String(index).padStart(2, "0")}` : null,
      status: index === 28 ? "INACTIVE" : "ACTIVE", allergyStatus,
      allergies: allergyStatus === "KNOWN" ? [{ id: `seed-allergy-${index}`, name: `Demo allergen ${String.fromCharCode(65 + (index % 4))}`, reaction: "Fictional recorded reaction" }] : [],
      conditions: index % 4 === 0 ? [{ id: `seed-condition-${index}`, name: "Demo chronic condition", status: "Active" }] : [],
      medications: index % 5 === 0 ? [{ id: `seed-medication-${index}`, name: "Demo historical medicine", details: "Fictional record — no dosage", status: "Current" }] : [],
      createdAt: now.toISOString(),
    };
  });
  const appointments: Appointment[] = [];
  const encounters: Encounter[] = [];
  for (let index = 0; index < 12; index += 1) {
    const day = index < 8 ? startOfDay(now) : addDays(startOfDay(now), 1);
    const startsAt = setMinutes(setHours(day, 8 + (index % 8)), index % 2 === 0 ? 0 : 30).toISOString();
    const status = index === 0 ? "COMPLETED" : index === 1 ? "CHECKED_IN" : index === 7 ? "CANCELLED" : "SCHEDULED";
    const appointment: Appointment = { id: `seed-appointment-${index + 1}`, patientId: patients[index].id, startsAt, visitReason: reasons[index % reasons.length], status };
    appointments.push(appointment);
    if (index < 2) {
      const encounter = blankEncounter(appointment.patientId, appointment.id, appointment.visitReason);
      encounter.id = `seed-encounter-${index + 1}`;
      encounter.subjective = index === 0 ? "Fictional patient history recorded for the portfolio demo." : "Draft text retained between visits.";
      if (index === 0) {
        encounter.status = "COMPLETED"; encounter.revision = 2;
        encounter.objective = "Demonstration observation only."; encounter.assessment = "Demo assessment recorded.";
        encounter.plan = "Demo follow-up plan recorded."; encounter.completedAt = subDays(now, 1).toISOString();
        encounter.orders = [{ id: "seed-order-1", type: "LAB", catalogKey: "demo-lab-panel", itemName: "Demo wellness panel", instructions: "", status: "ORDERED" }];
      }
      encounters.push(encounter);
    }
  }
  for (let index = 2; index < 16; index += 1) {
    const encounter = blankEncounter(patients[index].id, null, reasons[index % reasons.length]);
    encounter.id = `seed-encounter-${index + 1}`; encounter.revision = 1;
    encounter.subjective = "Fictional historical note.";
    encounter.objective = index % 3 === 0 ? "Demonstration observation." : "";
    encounter.assessment = "Demo assessment."; encounter.plan = "Demo plan.";
    if (index % 7 !== 0) { encounter.status = "COMPLETED"; encounter.completedAt = subDays(now, index + 2).toISOString(); }
    encounters.push(encounter);
  }
  return { version: 1, nextMrn: 31, patients, appointments, encounters };
}

function storage() {
  if (typeof window === "undefined") throw new DemoError("BROWSER_ONLY", "The demo is available after the page loads in your browser.");
  try { return window.sessionStorage; }
  catch { throw new DemoError("STORAGE_UNAVAILABLE", "Browser session storage is unavailable. Allow site storage to use this demo."); }
}

function write(state: DemoState) {
  try { storage().setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { throw new DemoError("STORAGE_UNAVAILABLE", "The demo could not save in this browser tab. Check your storage settings or available space."); }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function readDemo(): DemoState {
  const raw = storage().getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed: DemoState = JSON.parse(raw);
      if (parsed.version === 1 && Array.isArray(parsed.patients) && Array.isArray(parsed.encounters)) return parsed;
    } catch { /* show a recoverable message below */ }
    throw new DemoError("STORAGE_CORRUPT", "This tab's demo data cannot be read. Reset the demo to restore the fictional records.");
  }
  const seed = makeSeedData();
  write(seed);
  return seed;
}

function update<T>(change: (state: DemoState) => T): T {
  const state = readDemo();
  const result = change(state);
  write(state);
  return result;
}

export function resetDemo() { const seed = makeSeedData(); write(seed); return seed; }

export function registerPatient(raw: PatientRegistrationInput): Patient {
  const input = patientRegistrationSchema.parse(raw);
  return update((state) => {
    const patient: Patient = { id: crypto.randomUUID(), medicalRecordNumber: `CC-${String(state.nextMrn++).padStart(6, "0")}`,
      firstName: input.firstName, lastName: input.lastName, dateOfBirth: new Date(`${input.dateOfBirth}T12:00:00Z`).toISOString(),
      sex: input.sex || null, email: input.email || null, phone: input.phone || null,
      emergencyName: input.emergencyName || null, emergencyPhone: input.emergencyPhone || null,
      status: "ACTIVE", allergyStatus: "NOT_RECORDED", allergies: [], conditions: [], medications: [], createdAt: new Date().toISOString() };
    state.patients.push(patient);
    return patient;
  });
}

export function startEncounter(patientId: string, appointmentId?: string | null): Encounter {
  return update((state) => {
    if (!state.patients.some((patient) => patient.id === patientId)) throw new DemoError("PATIENT_NOT_FOUND", "Patient was not found in this tab's demo.");
    let appointment: Appointment | undefined;
    if (appointmentId) {
      appointment = state.appointments.find((item) => item.id === appointmentId && item.patientId === patientId);
      if (!appointment) throw new DemoError("APPOINTMENT_NOT_FOUND", "Appointment was not found for this patient.");
      if (appointment.status === "CANCELLED") throw new DemoError("APPOINTMENT_CANCELLED", "A cancelled appointment cannot be started.");
      const existing = state.encounters.find((item) => item.appointmentId === appointmentId);
      if (existing) return existing;
    }
    const encounter = blankEncounter(patientId, appointment?.id ?? null, appointment?.visitReason);
    state.encounters.push(encounter);
    return encounter;
  });
}

export function saveEncounterDraft(encounterId: string, patientId: string, raw: EncounterDraftInput): Encounter {
  const input = encounterDraftSchema.parse(raw);
  return update((state) => {
    const encounter = state.encounters.find((item) => item.id === encounterId && item.patientId === patientId);
    if (!encounter) throw new DemoError("ENCOUNTER_NOT_FOUND", "Encounter was not found for this patient.");
    if (encounter.status === "COMPLETED") throw new DemoError("ENCOUNTER_COMPLETED", "Completed encounters are read-only.");
    if (encounter.revision !== input.revision) throw new DemoError("REVISION_CONFLICT", "This encounter has a newer saved revision.", { currentRevision: encounter.revision, serverEncounter: structuredClone(encounter) });
    Object.assign(encounter, input, {
      revision: encounter.revision + 1, updatedAt: new Date().toISOString(),
      orders: input.orders.map((order) => ({ ...order, id: order.id || crypto.randomUUID(), instructions: order.instructions || "", status: "DRAFT" as const })),
    });
    return encounter;
  });
}

export function completeEncounter(encounterId: string, patientId: string, revision: number): Encounter {
  return update((state) => {
    const encounter = state.encounters.find((item) => item.id === encounterId && item.patientId === patientId);
    if (!encounter) throw new DemoError("ENCOUNTER_NOT_FOUND", "Encounter was not found for this patient.");
    if (encounter.status === "COMPLETED") return encounter;
    if (encounter.revision !== revision) throw new DemoError("REVISION_CONFLICT", "Save or resolve the newer revision before completing.", { currentRevision: encounter.revision });
    const errors = getCompletionErrors(encounter);
    if (errors.length) throw new DemoError("COMPLETION_REQUIREMENTS", "Complete the required encounter fields.", { errors });
    encounter.status = "COMPLETED"; encounter.completedAt = new Date().toISOString(); encounter.updatedAt = encounter.completedAt;
    encounter.orders.forEach((order) => { order.status = "ORDERED"; });
    const appointment = state.appointments.find((item) => item.id === encounter.appointmentId);
    if (appointment) appointment.status = "COMPLETED";
    return encounter;
  });
}

export function setAppointmentStatus(id: string, status: AppointmentStatus): Appointment {
  appointmentStatusSchema.parse({ status });
  return update((state) => {
    const appointment = state.appointments.find((item) => item.id === id);
    if (!appointment) throw new DemoError("APPOINTMENT_NOT_FOUND", "Appointment was not found.");
    if (status === "COMPLETED" && !state.encounters.some((item) => item.appointmentId === id && item.status === "COMPLETED")) throw new DemoError("ENCOUNTER_REQUIRED", "Complete the linked encounter to mark this appointment completed.");
    if (appointment.status === "COMPLETED" && status !== "COMPLETED") throw new DemoError("APPOINTMENT_COMPLETED", "A completed appointment cannot be reopened in this demo.");
    appointment.status = status;
    return appointment;
  });
}

export function useDemoData() {
  const [state, setState] = useState<DemoState | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => { try { setState(readDemo()); setError(""); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load this tab's demo data."); } };
    refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, []);
  return { state, error };
}
