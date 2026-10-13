"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { readApiError } from "@/lib/utils";

export function StartEncounterButton({ patientId, appointmentId, existingEncounterId, compact = false }: { patientId: string; appointmentId?: string; existingEncounterId?: string | null; compact?: boolean }) {
  const router = useRouter();
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    if (existingEncounterId) {
      router.push(`/patients/${patientId}/encounters/${existingEncounterId}`);
      return;
    }
    setPending(true); setError("");
    try {
      const response = await fetch("/api/encounters", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ patientId, appointmentId }) });
      if (!response.ok) throw await readApiError(response);
      const data = await response.json();
      router.push(`/patients/${patientId}/encounters/${data.encounter.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the encounter.");
      setPending(false);
    }
  }
  return <div className={compact ? "" : "space-y-1"}><Button variant={existingEncounterId ? "secondary" : "primary"} className={compact ? "min-h-9 px-3 py-1.5 text-xs" : ""} disabled={pending || !ready} onClick={() => void start()}><Play size={15} />{pending ? "Starting…" : existingEncounterId ? "Resume encounter" : "Start encounter"}</Button>{error ? <p role="alert" className="max-w-52 text-xs text-red-700">{error}</p> : null}</div>;
}
