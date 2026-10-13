import { format, subDays } from "date-fns";
import type { AppointmentStatus, DemoState } from "@/lib/browser-demo";

export const appointmentStatuses: { status: AppointmentStatus; label: string; color: string }[] = [
  { status: "SCHEDULED", label: "Scheduled", color: "#0d9488" },
  { status: "CHECKED_IN", label: "Checked in", color: "#0ea5e9" },
  { status: "COMPLETED", label: "Completed", color: "#22c55e" },
  { status: "CANCELLED", label: "Cancelled", color: "#f59e0b" },
];

export function getDashboardMetrics(state: DemoState, now = new Date()) {
  const todayKey = format(now, "yyyy-MM-dd");
  const todayAppointments = state.appointments
    .filter((appointment) => format(new Date(appointment.startsAt), "yyyy-MM-dd") === todayKey)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const statusCounts = Object.fromEntries(appointmentStatuses.map(({ status }) => [status, todayAppointments.filter((item) => item.status === status).length])) as Record<AppointmentStatus, number>;
  const completedEncounters = state.encounters.filter((encounter) => encounter.status === "COMPLETED");
  const openEncounters = state.encounters.filter((encounter) => encounter.status === "DRAFT")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const completionTrend = Array.from({ length: 14 }, (_, index) => {
    const day = subDays(now, 13 - index);
    const key = format(day, "yyyy-MM-dd");
    return {
      key,
      label: format(day, "d MMM"),
      count: completedEncounters.filter((encounter) => encounter.completedAt && format(new Date(encounter.completedAt), "yyyy-MM-dd") === key).length,
    };
  });

  return {
    todayAppointments,
    statusCounts,
    openEncounters,
    completionTrend,
    activePatients: state.patients.filter((patient) => patient.status === "ACTIVE").length,
    completionRate: state.encounters.length ? Math.round((completedEncounters.length / state.encounters.length) * 100) : 0,
    cancellationRate: todayAppointments.length ? Math.round((statusCounts.CANCELLED / todayAppointments.length) * 100) : 0,
    completedLast14Days: completionTrend.reduce((total, day) => total + day.count, 0),
  };
}
