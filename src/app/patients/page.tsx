"use client";

import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useDemoData } from "@/lib/browser-demo";
import { listPatientsFromDemo } from "@/lib/patient-directory";
import { calculateAge, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function queryString(params: { q: string; status: string; page: number }) {
  const value = new URLSearchParams();
  if (params.q) value.set("q", params.q);
  if (params.status !== "ALL") value.set("status", params.status);
  value.set("page", String(params.page));
  return value.toString();
}

export default function PatientsPage() {
  const { state, error } = useDemoData();
  const search = useSyncExternalStore(() => () => {}, () => window.location.search, () => "");
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>;
  if (!state) return <p role="status" className="p-5 text-sm text-slate-600">Loading this tab&apos;s fictional records…</p>;
  const query = new URLSearchParams(search);
  const result = listPatientsFromDemo(state, { q: query.get("q"), status: query.get("status"), page: query.get("page") });
  const returnTo = `/patients?${queryString(result.params)}`;
  const chartHref = (id: string) => `/patients/chart?id=${encodeURIComponent(id)}&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-teal-700">Records</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Patient directory</h1>
          <p className="mt-2 text-sm text-slate-600">Search fictional records by name or medical record number.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800" href="/patients/new">
          <UserPlus size={18} />Register patient
        </Link>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_190px_auto]" role="search">
        <label className="relative">
          <span className="sr-only">Search patients</span>
          <Search className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={18} />
          <input name="q" defaultValue={result.params.q} placeholder="Name or MRN" className="min-h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
        </label>
        <label>
          <span className="sr-only">Patient status</span>
          <select name="status" defaultValue={result.params.status} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
            <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <button className="min-h-11 rounded-lg border border-slate-300 bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">Apply</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Patient search results">
        <div className="border-b border-slate-200 px-5 py-4 text-sm text-slate-600"><strong className="text-slate-950">{result.total}</strong> matching records</div>
        {result.patients.length ? (
          <>
            <div className="divide-y divide-slate-100 sm:hidden">
              {result.patients.map((patient) => (
                <article key={patient.id} className="space-y-3 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-950">{patient.firstName} {patient.lastName}</h2>
                      <p className="mt-1 font-mono text-xs text-slate-600">{patient.medicalRecordNumber}</p>
                    </div>
                    <Badge tone={patient.status === "ACTIVE" ? "green" : "neutral"}>{patient.status.toLowerCase()}</Badge>
                  </div>
                  <div className="flex justify-between gap-3 text-sm text-slate-600">
                    <span>Age {calculateAge(patient.dateOfBirth)}</span>
                    <span className="text-right">Last visit: {formatDate(patient.encounters[0]?.completedAt, "None")}</span>
                  </div>
                  <Link className="inline-flex min-h-10 items-center font-semibold text-teal-700 hover:underline" href={chartHref(patient.id)}>Open chart</Link>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3">Patient</th><th className="px-5 py-3">MRN</th><th className="px-5 py-3">Age</th><th className="px-5 py-3">Last visit</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-bold text-slate-950">{patient.firstName} {patient.lastName}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{patient.medicalRecordNumber}</td>
                      <td className="px-5 py-4">{calculateAge(patient.dateOfBirth)}</td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(patient.encounters[0]?.completedAt, "No completed visit")}</td>
                      <td className="px-5 py-4"><Badge tone={patient.status === "ACTIVE" ? "green" : "neutral"}>{patient.status.toLowerCase()}</Badge></td>
                      <td className="px-5 py-4 text-right"><Link className="font-semibold text-teal-700 hover:underline" href={chartHref(patient.id)}>Open chart</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto text-slate-300" size={38} />
            <h2 className="mt-4 font-bold">No matching patients</h2>
            <p className="mt-1 text-sm text-slate-500">Try a different name, MRN, or status filter.</p>
          </div>
        )}
      </section>

      {result.pageCount > 1 ? (
        <nav aria-label="Patient result pages" className="flex items-center justify-between">
          <Link aria-disabled={result.page === 1} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${result.page === 1 ? "pointer-events-none text-slate-400" : "bg-white hover:bg-slate-50"}`} href={`/patients?${queryString({ ...result.params, page: result.page - 1 })}`}>Previous</Link>
          <span className="text-sm text-slate-600">Page {result.page} of {result.pageCount}</span>
          <Link aria-disabled={result.page === result.pageCount} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${result.page === result.pageCount ? "pointer-events-none text-slate-400" : "bg-white hover:bg-slate-50"}`} href={`/patients?${queryString({ ...result.params, page: result.page + 1 })}`}>Next</Link>
        </nav>
      ) : null}
    </div>
  );
}
