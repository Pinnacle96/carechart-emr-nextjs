"use client";

import { useState } from "react";
import { setAppointmentStatus, type AppointmentStatus } from "@/lib/browser-demo";

const labels: Record<AppointmentStatus, string> = { SCHEDULED: "Scheduled", CHECKED_IN: "Checked in", COMPLETED: "Completed", CANCELLED: "Cancelled" };

export function AppointmentStatusSelect({ id, status }: { id: string; status: AppointmentStatus }) {
  const [value, setValue] = useState(status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function update(next: AppointmentStatus) {
    const previous = value; setValue(next); setPending(true); setError("");
    try { setAppointmentStatus(id, next); }
    catch (caught) { setValue(previous); setError(caught instanceof Error ? caught.message : "Could not update appointment."); }
    setPending(false);
  }
  return <div><select aria-label="Appointment status" className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100" value={value} disabled={pending || status === "COMPLETED"} onChange={(event) => void update(event.target.value as AppointmentStatus)}>{Object.entries(labels).map(([key, label]) => <option key={key} value={key} disabled={key === "COMPLETED" && status !== "COMPLETED"}>{label}</option>)}</select>{error ? <p role="alert" className="mt-1 max-w-48 text-xs text-red-700">{error}</p> : null}</div>;
}
