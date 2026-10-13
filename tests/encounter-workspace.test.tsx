// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EncounterWorkspace } from "@/features/encounters/encounter-workspace";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const encounter = {
  id: "encounter-test", patientId: "patient-test", status: "DRAFT" as const, revision: 0, completedAt: null,
  visitReason: "Initial demo reason", bloodPressure: "", heartRate: null, temperature: null, respiratoryRate: null, oxygenSaturation: null, weight: null, height: null,
  subjective: "", objective: "", assessment: "", plan: "", orders: [],
};

describe("encounter autosave failure recovery", () => {
  it("keeps unsaved form values when a request fails and offers retry", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("offline"));
    render(<EncounterWorkspace encounter={encounter} />);
    const reason = screen.getByLabelText("Visit reason *");
    fireEvent.change(reason, { target: { value: "Unsaved fictional update" } });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    await waitFor(() => expect(screen.getByText(/Save failed/)).toBeInTheDocument());
    expect(reason).toHaveValue("Unsaved fictional update");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("does not call newer edits saved when an older request returns", async () => {
    let resolveFirst!: (value: unknown) => void;
    const first = new Promise((resolve) => { resolveFirst = resolve; });
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => first as Promise<Response>)
      .mockResolvedValue({ ok: true, json: async () => ({ encounter: { revision: 2 } }) } as Response);
    render(<EncounterWorkspace encounter={encounter} />);
    const reason = screen.getByLabelText("Visit reason *");
    fireEvent.change(reason, { target: { value: "First version" } });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.change(reason, { target: { value: "Newer unsaved version" } });
    resolveFirst({ ok: true, json: async () => ({ encounter: { revision: 1 } }) });
    await waitFor(() => expect(screen.getByText("New changes waiting to save")).toBeInTheDocument());
    expect(reason).toHaveValue("Newer unsaved version");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 3000 });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).draft.visitReason).toBe("Newer unsaved version");
    await waitFor(() => expect(screen.getByText("All changes saved")).toBeInTheDocument());
  });
});
