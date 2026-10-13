"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AlertTriangle, ArrowLeft, CalendarClock, ClipboardList, HeartPulse, Pill, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StartEncounterButton } from "@/features/encounters/start-encounter-button";
import { useDemoData } from "@/lib/browser-demo";
import { calculateAge, formatDate, formatTime } from "@/lib/utils";

export default function PatientChartPage() {
  const { state, error } = useDemoData();
  const search = useSyncExternalStore(() => () => {}, () => window.location.search, () => "");
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>;
  if (!state) return <p role="status" className="p-5 text-sm text-slate-600">Loading fictional chart…</p>;
  const query = new URLSearchParams(search);
  const patient = state.patients.find((item) => item.id === query.get("id"));
  if (!patient) return <div role="alert" className="rounded-xl border border-slate-200 bg-white p-6">This patient is not in this tab&apos;s demo. <Link className="font-semibold text-teal-700" href="/patients">Return to patients</Link>.</div>;
  const encounters = state.encounters.filter((item) => item.patientId === patient.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const appointments = state.appointments.filter((item) => item.patientId === patient.id && new Date(item.startsAt) >= new Date() && item.status !== "CANCELLED")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 5);
  const suppliedReturn = query.get("returnTo") ?? "";
  const returnTo = /^\/patients(?:[/?]|$)/.test(suppliedReturn) ? suppliedReturn : "/patients";

  return <div className="space-y-6">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700" href={returnTo}><ArrowLeft size={16} />Back to patient results</Link>
    {query.has("registered") ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">Patient registered in this tab. MRN {patient.medicalRecordNumber} was generated.</div> : null}
    <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div className="flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-teal-50 text-lg font-black text-teal-800">{patient.firstName[0]}{patient.lastName[0]}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{patient.firstName} {patient.lastName}</h1><Badge tone={patient.status === "ACTIVE" ? "green" : "neutral"}>{patient.status.toLowerCase()}</Badge></div><p className="mt-2 text-sm text-slate-600">{patient.medicalRecordNumber} · {calculateAge(patient.dateOfBirth)} years · Born {formatDate(patient.dateOfBirth)}</p></div></div><StartEncounterButton patientId={patient.id} /></div></header>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4"><ShieldAlert size={19} className="text-teal-700" /><h2 className="font-bold">Allergies</h2></div><div className="p-5">{patient.allergyStatus === "KNOWN" ? <div className="space-y-3">{patient.allergies.map((allergy) => <div key={allergy.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold text-amber-950">{allergy.name}</p><p className="mt-1 text-sm text-amber-900">{allergy.reaction || "Reaction not recorded"}</p></div>)}</div> : patient.allergyStatus === "NONE_KNOWN" ? <p className="text-sm font-semibold text-emerald-800">No known allergies explicitly recorded</p> : <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><AlertTriangle className="shrink-0 text-slate-500" size={19} /><div><p className="font-semibold">Allergy information not recorded</p><p className="mt-1 text-sm text-slate-600">This is unknown information, not a confirmed negative.</p></div></div>}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4"><ClipboardList size={19} className="text-teal-700" /><h2 className="font-bold">Encounter history</h2></div>{encounters.length ? <div className="divide-y divide-slate-100">{encounters.map((encounter) => <Link key={encounter.id} href={`/patients/encounter?patient=${encodeURIComponent(patient.id)}&id=${encodeURIComponent(encounter.id)}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"><div><p className="font-semibold text-slate-950">{encounter.visitReason || "Visit reason not yet recorded"}</p><p className="mt-1 text-xs text-slate-500">Created {formatDate(encounter.createdAt)} · {encounter.orders.length} orders</p></div><Badge tone={encounter.status === "COMPLETED" ? "green" : "amber"}>{encounter.status.toLowerCase()}</Badge></Link>)}</div> : <div className="p-8 text-center text-sm text-slate-500">No encounters have been recorded for this patient.</div>}</section>
    </div><aside className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><HeartPulse size={18} className="text-teal-700" /><h2 className="font-bold">Active conditions</h2></div>{patient.conditions.length ? <ul className="mt-4 space-y-3">{patient.conditions.map((condition) => <li key={condition.id} className="text-sm"><span className="font-semibold">{condition.name}</span><span className="ml-2 text-slate-500">{condition.status}</span></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No conditions are recorded.</p>}</section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Pill size={18} className="text-teal-700" /><h2 className="font-bold">Current medications</h2></div>{patient.medications.length ? <ul className="mt-4 space-y-3">{patient.medications.map((medication) => <li key={medication.id} className="text-sm"><p className="font-semibold">{medication.name}</p><p className="mt-1 text-slate-500">{medication.details || "Details not recorded"}</p></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No current medications are recorded.</p>}</section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarClock size={18} className="text-teal-700" /><h2 className="font-bold">Upcoming appointments</h2></div>{appointments.length ? <ul className="mt-4 space-y-4">{appointments.map((appointment) => { const linked = encounters.find((item) => item.appointmentId === appointment.id); return <li key={appointment.id} className="border-l-2 border-teal-200 pl-3"><p className="text-sm font-semibold">{formatDate(appointment.startsAt)} at {formatTime(appointment.startsAt)}</p><p className="mt-1 text-xs text-slate-500">{appointment.visitReason}</p><div className="mt-2"><StartEncounterButton compact patientId={patient.id} appointmentId={appointment.id} existingEncounterId={linked?.id} /></div></li>; })}</ul> : <p className="mt-4 text-sm text-slate-500">No upcoming appointments.</p>}</section>
    </aside></div>
  </div>;
}
