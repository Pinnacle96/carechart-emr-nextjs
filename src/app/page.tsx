"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Activity, ArrowRight, CalendarDays, ClipboardList, Clock3, FileText, UserPlus, Users } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { appointmentStatuses, getDashboardMetrics } from "@/lib/dashboard";
import { useDemoData } from "@/lib/browser-demo";
import { formatTime } from "@/lib/utils";

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof CalendarDays }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-slate-600">{label}</p><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={19} aria-hidden /></span></div>
    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
  </div>;
}

export default function Home() {
  const { state, error } = useDemoData();
  const search = useSyncExternalStore(() => () => {}, () => window.location.search, () => "");
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>;
  if (!state) return <p role="status" className="p-5 text-sm text-slate-600">Loading this tab&apos;s fictional dashboard…</p>;

  const now = new Date();
  const metrics = getDashboardMetrics(state, now);
  const todayCount = metrics.todayAppointments.length;
  const segmentStart = appointmentStatuses.reduce<Record<string, number>>((result, item, index) => {
    result[item.status] = appointmentStatuses.slice(0, index).reduce((total, prior) => total + metrics.statusCounts[prior.status], 0);
    return result;
  }, {});
  const gradient = todayCount
    ? `conic-gradient(${appointmentStatuses.map((item) => {
      const start = (segmentStart[item.status] / todayCount) * 100;
      const end = ((segmentStart[item.status] + metrics.statusCounts[item.status]) / todayCount) * 100;
      return `${item.color} ${start}% ${end}%`;
    }).join(", ")})`
    : "conic-gradient(#e2e8f0 0% 100%)";
  const maxTrend = Math.max(1, ...metrics.completionTrend.map((day) => day.count));
  const nextVisits = metrics.todayAppointments.filter((item) => item.status === "CHECKED_IN" || item.status === "SCHEDULED").slice(0, 4);

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-slate-950 px-5 py-7 text-white shadow-sm sm:px-8 sm:py-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div><p className="text-sm font-semibold text-teal-300">CareChart overview · {format(now, "EEEE, d MMMM yyyy")}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Today at a glance</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">A live operational view of this tab&apos;s fictional patients, visits, and documentation. For demonstration only—not clinical decision support.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/appointments" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300">View schedule <ArrowRight size={16} aria-hidden /></Link><Link href="/patients/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"><UserPlus size={16} aria-hidden /> Register patient</Link></div>
      </div>
    </section>

    {new URLSearchParams(search).get("reset") === "done" ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">Demo data was restored in this tab.</div> : null}

    <section aria-labelledby="kpi-heading"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 id="kpi-heading" className="text-lg font-bold text-slate-950">Key performance indicators</h2><p className="mt-1 text-xs text-slate-500">Live counts from this browser tab. Today uses your device&apos;s local date.</p></div><span className="text-xs font-medium text-slate-500">Fictional demo data</span></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Visits today" value={todayCount} detail="All appointments on today’s schedule" icon={CalendarDays} />
        <MetricCard label="Checked in" value={metrics.statusCounts.CHECKED_IN} detail="Today’s patients marked checked in" icon={Clock3} />
        <MetricCard label="Visits completed" value={metrics.statusCounts.COMPLETED} detail="Completed appointments today" icon={Activity} />
        <MetricCard label="Open encounters" value={metrics.openEncounters.length} detail="Draft notes across all dates" icon={FileText} />
      </div>
    </section>

    <div className="grid gap-4 xl:grid-cols-[1fr_1.25fr]">
      <section aria-labelledby="mix-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 id="mix-heading" className="text-lg font-bold">Today&apos;s appointment mix</h2><p className="mt-1 text-xs text-slate-500">Status breakdown · {todayCount} total visits</p>
        <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:justify-around"><div role="img" aria-label={`Today's appointments: ${appointmentStatuses.map((item) => `${metrics.statusCounts[item.status]} ${item.label.toLowerCase()}`).join(", ")}`} className="relative grid h-44 w-44 shrink-0 place-items-center rounded-full" style={{ background: gradient }}><div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center"><span><strong className="block text-3xl text-slate-950">{todayCount}</strong><span className="text-xs font-medium text-slate-500">visits today</span></span></div></div>
          <ul className="w-full max-w-xs space-y-3">{appointmentStatuses.map((item) => <li key={item.status} className="flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><strong className="tabular-nums text-slate-950">{metrics.statusCounts[item.status]}</strong></li>)}</ul></div>
      </section>

      <section aria-labelledby="trend-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 id="trend-heading" className="text-lg font-bold">Encounter completions</h2><p className="mt-1 text-xs text-slate-500">Daily completed notes · last 14 calendar days</p></div><div className="text-right"><strong className="text-2xl text-slate-950">{metrics.completedLast14Days}</strong><p className="text-[11px] text-slate-500">in period</p></div></div>
        <div role="img" aria-label={`Encounter completions by day: ${metrics.completionTrend.map((day) => `${day.label}: ${day.count}`).join(", ")}`} className="mt-8 flex h-40 items-end gap-1.5 border-b border-slate-200 pb-1 sm:gap-2">{metrics.completionTrend.map((day) => <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${day.label}: ${day.count} completed`}><div className="min-h-1 w-full rounded-t bg-teal-500" style={{ height: `${day.count ? Math.max(12, (day.count / maxTrend) * 100) : 2}%`, opacity: day.count ? 1 : 0.22 }} /></div>)}</div>
        <div className="mt-2 flex justify-between text-[11px] text-slate-500"><span>{metrics.completionTrend[0].label}</span><span>{metrics.completionTrend[6].label}</span><span>{metrics.completionTrend[13].label}</span></div>
        <p className="mt-5 text-xs leading-5 text-slate-500">Counts use each encounter&apos;s completion date, not its appointment date.</p>
      </section>
    </div>

    <section aria-labelledby="additional-kpi-heading"><h2 id="additional-kpi-heading" className="mb-4 text-lg font-bold text-slate-950">Additional indicators</h2><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard label="Active patients" value={metrics.activePatients} detail="Active records in this browser tab" icon={Users} />
      <MetricCard label="Encounter completion" value={`${metrics.completionRate}%`} detail="Completed ÷ all encounters in this tab" icon={ClipboardList} />
      <MetricCard label="Cancellation rate" value={`${metrics.cancellationRate}%`} detail="Today’s cancelled ÷ all visits today" icon={CalendarDays} />
      <MetricCard label="14-day completions" value={metrics.completedLast14Days} detail="Encounter notes completed in the period" icon={Activity} />
    </div></section>

    <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <section aria-labelledby="queue-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h2 id="queue-heading" className="font-bold">Visit queue</h2><p className="mt-1 text-xs text-slate-500">Today&apos;s scheduled and checked-in appointments</p></div><Link href="/appointments" className="text-sm font-semibold text-teal-700 hover:underline">All visits</Link></div>
        {nextVisits.length ? <ul className="divide-y divide-slate-100">{nextVisits.map((appointment) => { const patient = state.patients.find((item) => item.id === appointment.patientId); return <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><Link href={`/patients/chart?id=${encodeURIComponent(appointment.patientId)}`} className="font-semibold text-slate-950 hover:text-teal-700 hover:underline">{patient ? `${patient.firstName} ${patient.lastName}` : "Patient unavailable"}</Link><p className="mt-1 text-xs text-slate-500">{formatTime(appointment.startsAt)} · {appointment.visitReason}</p></div><Badge tone={appointment.status === "CHECKED_IN" ? "blue" : "neutral"}>{appointment.status === "CHECKED_IN" ? "Checked in" : "Scheduled"}</Badge></li>; })}</ul> : <p className="px-5 py-8 text-sm text-slate-500">No more scheduled or checked-in visits today.</p>}
      </section>
      <section aria-labelledby="drafts-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 id="drafts-heading" className="font-bold">Documentation queue</h2><p className="mt-1 text-xs text-slate-500">{metrics.openEncounters.length} open encounter drafts · newest updated first</p></div>
        {metrics.openEncounters.length ? <ul className="divide-y divide-slate-100">{metrics.openEncounters.slice(0, 4).map((encounter) => { const patient = state.patients.find((item) => item.id === encounter.patientId); return <li key={encounter.id}><Link href={`/patients/encounter?patient=${encodeURIComponent(encounter.patientId)}&id=${encodeURIComponent(encounter.id)}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"><span><span className="block text-sm font-semibold text-slate-950">{patient ? `${patient.firstName} ${patient.lastName}` : "Patient unavailable"}</span><span className="mt-1 block text-xs text-slate-500">{encounter.visitReason || "Visit reason not recorded"}</span></span><ArrowRight size={17} className="shrink-0 text-teal-700" aria-hidden /></Link></li>; })}</ul> : <p className="px-5 py-8 text-sm text-slate-500">No open encounter drafts.</p>}
        {metrics.openEncounters.length > 4 ? <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Showing 4 of {metrics.openEncounters.length} drafts. Find others in patient charts.</p> : null}
      </section>
    </div>
    <p className="text-xs leading-5 text-slate-500">These operational KPIs describe only fictional data in this browser tab. They are not benchmarks, outcomes, or medical recommendations.</p>
  </div>;
}
