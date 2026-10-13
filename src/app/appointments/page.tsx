"use client";

import Link from "next/link";
import { addDays, format, isValid, parseISO, subDays } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useSyncExternalStore } from "react";
import { AppointmentStatusSelect } from "@/features/appointments/appointment-status-select";
import { StartEncounterButton } from "@/features/encounters/start-encounter-button";
import { useDemoData } from "@/lib/browser-demo";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AppointmentsPage() {
  const { state, error } = useDemoData();
  const search = useSyncExternalStore(() => () => {}, () => window.location.search, () => "");
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>;
  if (!state) return <p role="status" className="p-5 text-sm text-slate-600">Loading this tab&apos;s fictional schedule…</p>;
  const params = new URLSearchParams(search);
  const parsed = params.get("date") ? parseISO(params.get("date")!) : new Date();
  const selected = isValid(parsed) ? parsed : new Date();
  const appointments = state.appointments.filter((appointment) => format(new Date(appointment.startsAt), "yyyy-MM-dd") === format(selected, "yyyy-MM-dd"))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((appointment) => ({ ...appointment, patient: state.patients.find((patient) => patient.id === appointment.patientId)!, encounter: state.encounters.find((encounter) => encounter.appointmentId === appointment.id) }));
  const dateValue = format(selected, "yyyy-MM-dd");
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-teal-700">Daily schedule</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Appointments</h1><p className="mt-2 text-sm text-slate-600">Coordinate today’s fictional visits and encounter work.</p></div><div className="flex items-center gap-2"><Link aria-label="Previous day" className="grid h-11 w-11 place-items-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50" href={`/appointments?date=${format(subDays(selected, 1), "yyyy-MM-dd")}`}><ChevronLeft size={19} /></Link><form><input aria-label="Schedule date" name="date" type="date" defaultValue={dateValue} className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold" /><button className="sr-only" type="submit">Go to date</button></form><Link aria-label="Next day" className="grid h-11 w-11 place-items-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50" href={`/appointments?date=${format(addDays(selected, 1), "yyyy-MM-dd")}`}><ChevronRight size={19} /></Link></div></div>
    {params.get("reset") === "done" ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">Demo data was restored in this tab.</div> : null}
    <section aria-labelledby="schedule-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 id="schedule-heading" className="font-bold text-slate-950">{format(selected, "EEEE, d MMMM yyyy")}</h2><p className="mt-1 text-xs text-slate-500">{appointments.length} {appointments.length === 1 ? "appointment" : "appointments"}</p></div><CalendarDays className="text-teal-700" size={22} /></div>
      {appointments.length ? <div className="divide-y divide-slate-100">{appointments.map((appointment) => <article key={appointment.id} className="grid gap-4 px-5 py-5 md:grid-cols-[90px_1fr_180px_auto] md:items-center"><div><p className="text-base font-bold text-slate-950">{formatTime(appointment.startsAt)}</p><Badge tone={appointment.status === "COMPLETED" ? "green" : appointment.status === "CANCELLED" ? "red" : appointment.status === "CHECKED_IN" ? "blue" : "neutral"}>{appointment.status.replace("_", " ").toLowerCase()}</Badge></div><div><Link className="font-bold text-slate-950 hover:text-teal-700 hover:underline" href={`/patients/chart?id=${encodeURIComponent(appointment.patient.id)}`}>{appointment.patient.firstName} {appointment.patient.lastName}</Link><p className="mt-1 text-sm text-slate-600">{appointment.visitReason}</p><p className="mt-1 text-xs text-slate-400">{appointment.patient.medicalRecordNumber}</p></div><AppointmentStatusSelect id={appointment.id} status={appointment.status} /><div>{appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" ? <StartEncounterButton compact patientId={appointment.patientId} appointmentId={appointment.id} existingEncounterId={appointment.encounter?.id} /> : appointment.encounter ? <Link className="text-sm font-semibold text-teal-700 hover:underline" href={`/patients/encounter?patient=${encodeURIComponent(appointment.patientId)}&id=${encodeURIComponent(appointment.encounter.id)}`}>View encounter</Link> : null}</div></article>)}</div> : <div className="px-6 py-16 text-center"><CalendarDays className="mx-auto text-slate-300" size={36} /><h3 className="mt-4 font-bold">No appointments for this day</h3><p className="mt-1 text-sm text-slate-500">Use the date controls to view another schedule.</p></div>}
    </section>
  </div>;
}
