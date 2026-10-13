import { describe, expect, it } from "vitest";
import { makeSeedData, type DemoState } from "@/lib/browser-demo";
import { getDashboardMetrics } from "@/lib/dashboard";

describe("operational dashboard metrics", () => {
  it("uses explicit denominators and local calendar dates for seeded KPIs", () => {
    const now = new Date(2026, 9, 13, 12);
    const metrics = getDashboardMetrics(makeSeedData(now), now);
    expect(metrics.todayAppointments).toHaveLength(8);
    expect(metrics.statusCounts).toEqual({ SCHEDULED: 5, CHECKED_IN: 1, COMPLETED: 1, CANCELLED: 1 });
    expect(metrics.activePatients).toBe(29);
    expect(metrics.openEncounters).toHaveLength(3);
    expect(metrics.completionRate).toBe(81);
    expect(metrics.cancellationRate).toBe(13);
    expect(metrics.completionTrend).toHaveLength(14);
    expect(metrics.completedLast14Days).toBe(10);
  });

  it("recalculates when appointments and encounters change", () => {
    const now = new Date(2026, 9, 13, 12);
    const state = makeSeedData(now);
    state.appointments[2].status = "CHECKED_IN";
    state.encounters[1].status = "COMPLETED";
    state.encounters[1].completedAt = now.toISOString();
    const metrics = getDashboardMetrics(state, now);
    expect(metrics.statusCounts.CHECKED_IN).toBe(2);
    expect(metrics.statusCounts.SCHEDULED).toBe(4);
    expect(metrics.openEncounters).toHaveLength(2);
    expect(metrics.completionRate).toBe(88);
    expect(metrics.completedLast14Days).toBe(11);
  });

  it("shows zero rates and an empty chart for an empty demo", () => {
    const state: DemoState = { version: 1, nextMrn: 1, patients: [], appointments: [], encounters: [] };
    const metrics = getDashboardMetrics(state, new Date(2026, 9, 13, 12));
    expect(metrics.cancellationRate).toBe(0);
    expect(metrics.completionRate).toBe(0);
    expect(metrics.completionTrend.every((day) => day.count === 0)).toBe(true);
  });
});
