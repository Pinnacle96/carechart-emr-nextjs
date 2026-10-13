import type { Metadata } from "next";
import { PatientRegistrationForm } from "@/features/patients/patient-registration-form";

export const metadata: Metadata = { title: "Register patient" };

export default function NewPatientPage() {
  return <div className="mx-auto max-w-4xl space-y-6"><div><p className="text-sm font-semibold text-teal-700">New fictional record</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Register a patient</h1><p className="mt-2 text-sm text-slate-600">A unique demo record number will be created in this browser tab. Use fictional data only.</p></div><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><PatientRegistrationForm /></section></div>;
}
