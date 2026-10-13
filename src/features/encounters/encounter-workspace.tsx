"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, CheckCircle2, ClipboardCheck, FileText, HeartPulse, LoaderCircle, Plus, RefreshCcw, Save, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/field";
import { LAB_CATALOGUE, MEDICATION_CATALOGUE } from "@/lib/constants";
import { encounterDraftSchema, type EncounterDraftInput } from "@/lib/validation/encounter";
import { readApiError } from "@/lib/utils";

type SaveState = "saved" | "dirty" | "saving" | "failed" | "conflict";
type InitialEncounter = EncounterDraftInput & { id: string; patientId: string; status: "DRAFT" | "COMPLETED"; completedAt: string | null };

const tabItems = [
  { value: "overview", label: "Overview", icon: ClipboardCheck },
  { value: "vitals", label: "Vitals", icon: HeartPulse },
  { value: "notes", label: "Notes", icon: FileText },
  { value: "orders", label: "Orders", icon: ShoppingCart },
  { value: "review", label: "Review", icon: CheckCircle2 },
] as const;

export function EncounterWorkspace({ encounter }: { encounter: InitialEncounter }) {
  const router = useRouter();
  const readOnly = encounter.status === "COMPLETED";
  const methods = useForm<EncounterDraftInput>({
    resolver: zodResolver(encounterDraftSchema),
    mode: "onBlur",
    defaultValues: encounter,
  });
  const { watch, getValues, trigger, reset, setValue, formState: { errors } } = methods;
  const [tab, setTab] = useState("overview");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveMessage, setSaveMessage] = useState(readOnly ? "Completed encounter" : "All changes saved");
  const [completionError, setCompletionError] = useState("");
  const [completionPending, setCompletionPending] = useState(false);
  const [conflict, setConflict] = useState<{ revision: number; serverEncounter?: Record<string, unknown> } | null>(null);
  const conflictRef = useRef(false);
  const revisionRef = useRef(encounter.revision);
  const changeSequence = useRef(0);
  const lastSavedSequence = useRef(0);
  const savePromise = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetting = useRef(false);

  const performSave = useCallback(async (): Promise<boolean> => {
    if (readOnly) return true;
    if (savePromise.current) {
      const priorSaved = await savePromise.current;
      if (!priorSaved || conflictRef.current) return false;
      if (changeSequence.current > lastSavedSequence.current) return performSave();
      return true;
    }
    if (conflictRef.current) return false;
    if (changeSequence.current === lastSavedSequence.current) return true;
    const valid = await trigger();
    if (!valid) { setSaveState("failed"); setSaveMessage("Fix validation errors before saving"); return false; }
    const snapshotSequence = changeSequence.current;
    const values = { ...getValues(), revision: revisionRef.current };
    setSaveState("saving"); setSaveMessage("Saving draft…");
    const operation = (async () => {
      try {
        const response = await fetch(`/api/encounters/${encounter.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ patientId: encounter.patientId, draft: values }) });
        if (!response.ok) {
          const issue = await readApiError(response);
          if (issue.code === "REVISION_CONFLICT") {
            const revision = Number(issue.details?.currentRevision ?? revisionRef.current);
            conflictRef.current = true;
            setConflict({ revision, serverEncounter: issue.details?.serverEncounter });
            setSaveState("conflict"); setSaveMessage("A newer saved revision exists");
          } else { setSaveState("failed"); setSaveMessage(issue.message); }
          return false;
        }
        const payload = await response.json();
        revisionRef.current = payload.encounter.revision;
        resetting.current = true;
        setValue("revision", payload.encounter.revision, { shouldDirty: false });
        queueMicrotask(() => { resetting.current = false; });
        lastSavedSequence.current = snapshotSequence;
        if (changeSequence.current === snapshotSequence) { setSaveState("saved"); setSaveMessage("All changes saved"); }
        else { setSaveState("dirty"); setSaveMessage("New changes waiting to save"); }
        return true;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return false;
        setSaveState("failed"); setSaveMessage("Save failed. Your changes remain in this form.");
        return false;
      }
    })();
    savePromise.current = operation;
    const result = await operation;
    savePromise.current = null;
    if (result && changeSequence.current > lastSavedSequence.current && !conflictRef.current) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { void performSave(); }, 900);
    }
    return result;
  }, [encounter.id, encounter.patientId, getValues, readOnly, setValue, trigger]);

  useEffect(() => {
    if (readOnly) return;
    // React Hook Form intentionally exposes a subscription API that React Compiler does not memoize.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((_values, info) => {
      if (resetting.current) return;
      if (info.name === "revision") return;
      changeSequence.current += 1;
      setSaveState((current) => current === "saving" ? current : "dirty");
      setSaveMessage("Unsaved changes");
      if (conflictRef.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { void performSave(); }, 900);
    });
    return () => { subscription.unsubscribe(); if (timer.current) clearTimeout(timer.current); };
  }, [performSave, readOnly, watch]);

  useEffect(() => {
    if (readOnly) return;
    const unsaved = () => ["dirty", "saving", "failed", "conflict"].includes(saveState);
    const beforeUnload = (event: BeforeUnloadEvent) => { if (unsaved()) event.preventDefault(); };
    const clickGuard = (event: MouseEvent) => {
      if (!unsaved()) return;
      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.href === window.location.href) return;
      if (!window.confirm("This encounter has unsaved changes. Leave and keep working from the last saved revision?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", clickGuard, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", clickGuard, true); };
  }, [readOnly, saveState]);

  async function complete() {
    setCompletionError("");
    if (conflictRef.current) { setCompletionError("Resolve the revision conflict before completing."); return; }
    setCompletionPending(true);
    try {
      if (changeSequence.current > lastSavedSequence.current || savePromise.current) {
        const saved = await performSave();
        if (!saved || changeSequence.current > lastSavedSequence.current) { setCompletionError("The draft could not be saved. Resolve the save issue before completing."); return; }
      }
      if (conflictRef.current) { setCompletionError("Resolve the revision conflict before completing."); return; }
      const response = await fetch(`/api/encounters/${encounter.id}/complete`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ patientId: encounter.patientId, revision: revisionRef.current }) });
      if (!response.ok) {
        const issue = await readApiError(response);
        setCompletionError(issue.message);
        if (issue.code === "COMPLETION_REQUIREMENTS") setTab("review");
        return;
      }
      setSaveState("saved"); setSaveMessage("Encounter completed"); router.refresh();
    } catch {
      setCompletionError("Completion failed. Your saved draft is available to retry.");
    } finally {
      setCompletionPending(false);
    }
  }

  function rebaseAndSave() {
    if (!conflict) return;
    revisionRef.current = conflict.revision;
    resetting.current = true;
    setValue("revision", conflict.revision, { shouldDirty: false });
    queueMicrotask(() => { resetting.current = false; });
    conflictRef.current = false;
    setConflict(null); setSaveState("dirty"); setSaveMessage("Ready to save your edits over the reviewed revision");
    void performSave();
  }

  function loadServerVersion() {
    const server = conflict?.serverEncounter;
    if (!server) { router.refresh(); return; }
    const values = mapServerEncounter(server);
    resetting.current = true; reset(values); revisionRef.current = values.revision; changeSequence.current = 0; lastSavedSequence.current = 0;
    conflictRef.current = false; setConflict(null); setSaveState("saved"); setSaveMessage("Loaded the newer saved revision");
    queueMicrotask(() => { resetting.current = false; });
  }

  const statusIcon = saveState === "saving" ? <LoaderCircle className="animate-spin" size={15} /> : saveState === "saved" ? <Check size={15} /> : saveState === "failed" || saveState === "conflict" ? <AlertCircle size={15} /> : <span className="h-2 w-2 rounded-full bg-amber-500" />;
  return <FormProvider {...methods}><div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center"><div className={`flex items-center gap-2 text-sm font-semibold ${saveState === "failed" || saveState === "conflict" ? "text-red-700" : saveState === "dirty" ? "text-amber-800" : "text-slate-600"}`} role="status" aria-live="polite">{statusIcon}{saveMessage}</div>{!readOnly ? <div className="flex gap-2"><Button variant="secondary" className="min-h-9 px-3 py-1.5 text-xs" disabled={saveState === "saving" || completionPending} onClick={() => void performSave()}><Save size={15} />Save now</Button>{saveState === "failed" ? <Button className="min-h-9 px-3 py-1.5 text-xs" disabled={completionPending} onClick={() => void performSave()}><RefreshCcw size={15} />Retry</Button> : null}</div> : <Badge tone="green">Read-only</Badge>}</div>
    {conflict ? <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4"><h2 className="font-bold text-red-950">A newer revision was saved</h2><p className="mt-1 text-sm text-red-900">Your edits are still in this form. Review the choice before replacing or loading the newer saved version.</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="danger" onClick={rebaseAndSave}>Keep my edits and save</Button><Button variant="secondary" onClick={loadServerVersion}>Load saved revision</Button></div></section> : null}
    <Tabs.Root value={tab} onValueChange={setTab} orientation="horizontal">
      <Tabs.List aria-label="Encounter sections" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">{tabItems.map(({ value, label, icon: Icon }) => <Tabs.Trigger key={value} value={value} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-600 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-800"><Icon size={17} />{label}</Tabs.Trigger>)}</Tabs.List>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <Tabs.Content value="overview"><OverviewSection disabled={readOnly || completionPending} /></Tabs.Content>
        <Tabs.Content value="vitals"><VitalsSection disabled={readOnly || completionPending} /></Tabs.Content>
        <Tabs.Content value="notes"><NotesSection disabled={readOnly || completionPending} /></Tabs.Content>
        <Tabs.Content value="orders"><OrdersSection disabled={readOnly || completionPending} /></Tabs.Content>
        <Tabs.Content value="review"><ReviewSection readOnly={readOnly} completedAt={encounter.completedAt} completionError={completionError} onComplete={complete} errors={Object.keys(errors).length} completionPending={completionPending} saveState={saveState} /></Tabs.Content>
      </div>
    </Tabs.Root>
  </div></FormProvider>;
}

function SectionHeading({ title, description }: { title: string; description: string }) { return <div className="mb-6"><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div>; }

function OverviewSection({ disabled }: { disabled: boolean }) { const { register, formState: { errors } } = useFormContext<EncounterDraftInput>(); return <div><SectionHeading title="Overview" description="Record the reason for this visit. This field is required before completion." /><Field label="Visit reason *" htmlFor="visitReason" error={errors.visitReason?.message}><Textarea id="visitReason" disabled={disabled} aria-invalid={Boolean(errors.visitReason)} {...register("visitReason")} /></Field></div>; }

function VitalsSection({ disabled }: { disabled: boolean }) {
  const { register, formState: { errors } } = useFormContext<EncounterDraftInput>();
  const numberOptions = { setValueAs: (value: string) => value === "" ? null : Number(value) };
  const numberFields = [
    ["heartRate", "Heart rate", "beats/min"], ["temperature", "Temperature", "°C"], ["respiratoryRate", "Respiratory rate", "breaths/min"], ["oxygenSaturation", "Oxygen saturation", "%"], ["weight", "Weight", "kg"], ["height", "Height", "cm"],
  ] as const;
  return <div><SectionHeading title="Vitals" description="Units are shown for clarity. Validation checks format and numeric values only; it does not apply clinical decision rules." /><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><Field label="Blood pressure" htmlFor="bloodPressure" error={errors.bloodPressure?.message} hint="mmHg · format 120/80"><Input id="bloodPressure" disabled={disabled} inputMode="numeric" placeholder="120/80" {...register("bloodPressure")} /></Field>{numberFields.map(([name, label, unit]) => <Field key={name} label={label} htmlFor={name} error={errors[name]?.message} hint={unit}><Input id={name} disabled={disabled} type="number" step={name === "temperature" || name === "weight" || name === "height" ? "0.1" : "1"} {...register(name, numberOptions)} /></Field>)}</div></div>;
}

function NotesSection({ disabled }: { disabled: boolean }) {
  const { register, formState: { errors } } = useFormContext<EncounterDraftInput>();
  const fields = [["subjective", "Subjective *", "Fictional history and reported concerns"], ["objective", "Objective", "Fictional observations"], ["assessment", "Assessment *", "Demo assessment text"], ["plan", "Plan *", "Demo follow-up plan"]] as const;
  return <div><SectionHeading title="Consultation notes" description="Subjective, assessment, and plan are required by this demo’s completion policy. This policy is not presented as a clinical standard." /><div className="grid gap-5 lg:grid-cols-2">{fields.map(([name, label, placeholder]) => <Field key={name} label={label} htmlFor={name} error={errors[name]?.message}><Textarea id={name} disabled={disabled} placeholder={placeholder} {...register(name)} /></Field>)}</div></div>;
}

function OrdersSection({ disabled }: { disabled: boolean }) {
  const { control, register, watch, setValue } = useFormContext<EncounterDraftInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "orders" });
  return <div><SectionHeading title="Fictional orders" description="Choose only from the small demonstration catalogue. CareChart does not calculate dosages or transmit orders." /><div className="space-y-4">{fields.map((field, index) => { const type = watch(`orders.${index}.type`); const catalogue = type === "MEDICATION" ? MEDICATION_CATALOGUE : LAB_CATALOGUE; return <div key={field.id} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[160px_1fr_1fr_auto]"><select aria-label={`Order ${index + 1} type`} disabled={disabled} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm" {...register(`orders.${index}.type`)} onChange={(event) => { const next = event.target.value as "MEDICATION" | "LAB"; setValue(`orders.${index}.type`, next, { shouldDirty: true }); const item = (next === "MEDICATION" ? MEDICATION_CATALOGUE : LAB_CATALOGUE)[0]; setValue(`orders.${index}.catalogKey`, item.key, { shouldDirty: true }); setValue(`orders.${index}.itemName`, item.name, { shouldDirty: true }); }}><option value="MEDICATION">Medication item</option><option value="LAB">Lab test</option></select><select aria-label={`Order ${index + 1} item`} disabled={disabled} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm" {...register(`orders.${index}.catalogKey`)} onChange={(event) => { const item = catalogue.find((entry) => entry.key === event.target.value)!; setValue(`orders.${index}.catalogKey`, item.key, { shouldDirty: true }); setValue(`orders.${index}.itemName`, item.name, { shouldDirty: true }); }}>{catalogue.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select><Input aria-label={`Order ${index + 1} optional instructions`} disabled={disabled} placeholder="Optional instructions — no dosage advice" {...register(`orders.${index}.instructions`)} />{!disabled ? <Button variant="ghost" aria-label={`Remove order ${index + 1}`} className="px-3 text-red-700" onClick={() => remove(index)}><Trash2 size={17} /></Button> : null}</div>; })}</div>{!disabled ? <Button variant="secondary" className="mt-4" onClick={() => append({ type: "LAB", catalogKey: LAB_CATALOGUE[0].key, itemName: LAB_CATALOGUE[0].name, instructions: "" })}><Plus size={17} />Add order</Button> : null}{fields.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No orders added. Orders are optional.</p> : null}</div>;
}

function ReviewSection({ readOnly, completedAt, completionError, onComplete, errors, completionPending, saveState }: { readOnly: boolean; completedAt: string | null; completionError: string; onComplete: () => Promise<void>; errors: number; completionPending: boolean; saveState: SaveState }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const values = useFormContext<EncounterDraftInput>().watch();
  const required = [{ label: "Visit reason", value: values.visitReason }, { label: "Subjective", value: values.subjective }, { label: "Assessment", value: values.assessment }, { label: "Plan", value: values.plan }];
  const ready = required.every((item) => item.value.trim()) && errors === 0;
  return <div><SectionHeading title="Review and completion" description="Review the saved draft before explicitly completing it. Completed encounters cannot be edited in this release." /><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Completion requirements</h3><ul className="mt-3 space-y-2">{required.map((item) => <li key={item.label} className="flex items-center gap-2 text-sm"><span className={`grid h-5 w-5 place-items-center rounded-full ${item.value.trim() ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{item.value.trim() ? <Check size={13} /> : "!"}</span>{item.label}</li>)}</ul></section><section className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Order summary</h3><p className="mt-3 text-sm text-slate-600">{values.orders.length ? `${values.orders.length} fictional order${values.orders.length === 1 ? "" : "s"} will be marked ordered.` : "No orders have been added."}</p><p className="mt-2 text-xs text-slate-500">No order is sent to an external provider.</p></section></div>{completionError ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{completionError}</p> : null}{readOnly ? <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Completed {completedAt ? new Date(completedAt).toLocaleString() : ""}. This encounter is read-only.</div> : <div className="mt-6 flex justify-end"><AlertDialog.Root open={dialogOpen} onOpenChange={setDialogOpen}><AlertDialog.Trigger asChild><Button disabled={!ready || completionPending || saveState === "conflict"}><CheckCircle2 size={18} />Complete encounter</Button></AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/45" /><AlertDialog.Content className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"><AlertDialog.Title className="text-lg font-bold">Complete this encounter?</AlertDialog.Title><AlertDialog.Description className="mt-2 text-sm leading-6 text-slate-600">{saveState !== "saved" ? "You have unsaved changes. CareChart will save them before completion. " : ""}CareChart will mark orders as ordered and update any linked appointment. This encounter will become read-only.</AlertDialog.Description><div className="mt-6 flex justify-end gap-3"><AlertDialog.Cancel asChild><Button variant="secondary" disabled={completionPending}>Continue editing</Button></AlertDialog.Cancel><AlertDialog.Action asChild><Button disabled={completionPending} onClick={(event) => { event.preventDefault(); void onComplete().finally(() => setDialogOpen(false)); }}>{completionPending ? "Completing…" : "Complete encounter"}</Button></AlertDialog.Action></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root></div>}</div>;
}

function mapServerEncounter(server: Record<string, unknown>): EncounterDraftInput {
  return {
    revision: Number(server.revision ?? 0), visitReason: String(server.visitReason ?? ""), bloodPressure: String(server.bloodPressure ?? ""),
    heartRate: numberOrNull(server.heartRate), temperature: numberOrNull(server.temperature), respiratoryRate: numberOrNull(server.respiratoryRate), oxygenSaturation: numberOrNull(server.oxygenSaturation), weight: numberOrNull(server.weight), height: numberOrNull(server.height),
    subjective: String(server.subjective ?? ""), objective: String(server.objective ?? ""), assessment: String(server.assessment ?? ""), plan: String(server.plan ?? ""),
    orders: Array.isArray(server.orders) ? server.orders.map((value) => { const order = value as Record<string, unknown>; return { id: String(order.id ?? ""), type: order.type === "MEDICATION" ? "MEDICATION" : "LAB", catalogKey: String(order.catalogKey ?? ""), itemName: String(order.itemName ?? ""), instructions: String(order.instructions ?? "") }; }) : [],
  };
}

function numberOrNull(value: unknown) { return typeof value === "number" ? value : null; }
