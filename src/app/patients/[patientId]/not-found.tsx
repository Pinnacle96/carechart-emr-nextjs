import Link from "next/link";

export default function NotFound() { return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center"><h1 className="text-xl font-bold">Patient record not found</h1><p className="mt-2 text-sm text-slate-600">The record may have been removed when demo data was reset.</p><Link className="mt-5 inline-flex rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white" href="/patients">Return to patients</Link></div>; }
