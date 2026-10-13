"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { readApiError } from "@/lib/utils";

export function ResetDemo() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function reset() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/demo/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: "RESET" }) });
      if (!response.ok) throw await readApiError(response);
      router.push("/appointments?reset=done");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reset failed. Try again.");
      setPending(false);
      router.refresh();
    }
  }
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild><Button variant="ghost" className="px-3 text-xs"><RotateCcw size={15} />Reset demo data</Button></AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/45" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl focus:outline-none">
          <AlertDialog.Title className="text-lg font-bold text-slate-950">Reset the local demo?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-6 text-slate-600">All demo edits, new patients, and draft encounters will be removed. The original fictional seed data will be restored.</AlertDialog.Description>
          {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild><Button variant="secondary" disabled={pending}>Keep my changes</Button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><Button variant="danger" disabled={pending} onClick={(event) => { event.preventDefault(); void reset(); }}>{pending ? "Resetting…" : "Reset demo"}</Button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
