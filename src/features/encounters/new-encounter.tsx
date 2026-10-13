"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { readApiError } from "@/lib/utils";

export function NewEncounter({ patientId }: { patientId: string }) {
  const router = useRouter(); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function create() { setPending(true); setError(""); const response = await fetch("/api/encounters", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ patientId }) }); if (!response.ok) { const issue = await readApiError(response); setError(issue.message); setPending(false); return; } const data = await response.json(); router.replace(`/patients/${patientId}/encounters/${data.encounter.id}`); }
  return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold">Start a new encounter</h1><p className="mt-2 text-sm leading-6 text-slate-600">A recoverable draft will be created for this fictional patient. No clinical recommendations are generated.</p>{error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}<div className="mt-6 flex justify-center gap-3"><Button variant="secondary" onClick={() => router.back()} disabled={pending}>Cancel</Button><Button onClick={() => void create()} disabled={pending}>{pending ? "Creating…" : "Create draft"}</Button></div></div>;
}
