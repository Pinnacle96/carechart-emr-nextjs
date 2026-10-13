"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EncounterWorkspace } from "@/features/encounters/encounter-workspace";
import { useDemoData } from "@/lib/browser-demo";
import { calculateAge } from "@/lib/utils";

export default function EncounterPage() {
  const { state, error } = useDemoData();
  const search = useSyncExternalStore(() => () => {}, () => window.location.search, () => "");
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>;
  if (!state) return <p role="status" className="p-5 text-sm text-slate-600">Loading fictional encounter…</p>;
  const query = new URLSearchParams(search);
  const patientId = query.get("patient");
  const encounter = state.encounters.find((item) => item.id === query.get("id") && item.patientId === patientId);
  const patient = state.patients.find((item) => item.id === patientId);
  if (!encounter || !patient) return <div role="alert" className="rounded-xl border border-slate-200 bg-white p-6">This encounter is not in this tab&apos;s demo. <Link className="font-semibold text-teal-700" href="/patients">Return to patients</Link>.</div>;
  return <div className="space-y-5">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700" href={`/patients/chart?id=${encodeURIComponent(patient.id)}`}><ArrowLeft size={16} />Back to patient chart</Link>
    <header className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-300">Encounter workspace</p><h1 className="mt-1 text-2xl font-bold">{patient.firstName} {patient.lastName}</h1><p className="mt-2 text-sm text-slate-300">{patient.medicalRecordNumber} · {calculateAge(patient.dateOfBirth)} years · Fictional record</p></div><Badge tone={encounter.status === "COMPLETED" ? "green" : "amber"}>{encounter.status.toLowerCase()}</Badge></div></header>
    <EncounterWorkspace key={encounter.id} encounter={encounter} />
  </div>;
}
