import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EncounterWorkspace } from "@/features/encounters/encounter-workspace";
import { prisma } from "@/lib/db/prisma";
import { getDemoSession } from "@/lib/db/session";
import { calculateAge } from "@/lib/utils";

export const metadata: Metadata = { title: "Encounter" };
export const dynamic = "force-dynamic";

export default async function EncounterPage({ params }: { params: Promise<{ patientId: string; encounterId: string }> }) {
  const { patientId, encounterId } = await params;
  const session = await getDemoSession(prisma);
  const encounter = await prisma.encounter.findFirst({ where: { id: encounterId, patientId, demoSessionId: session.id }, include: { patient: true, orders: { orderBy: { id: "asc" } } } });
  if (!encounter) notFound();
  const initial = {
    id: encounter.id, patientId: encounter.patientId, status: encounter.status, revision: encounter.revision, completedAt: encounter.completedAt?.toISOString() ?? null,
    visitReason: encounter.visitReason, bloodPressure: encounter.bloodPressure ?? "", heartRate: encounter.heartRate, temperature: encounter.temperature, respiratoryRate: encounter.respiratoryRate, oxygenSaturation: encounter.oxygenSaturation, weight: encounter.weight, height: encounter.height,
    subjective: encounter.subjective, objective: encounter.objective, assessment: encounter.assessment, plan: encounter.plan,
    orders: encounter.orders.map((order) => ({ id: order.id, type: order.type, catalogKey: order.catalogKey, itemName: order.itemName, instructions: order.instructions ?? "" })),
  };
  return <div className="space-y-5"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700" href={`/patients/${patientId}`}><ArrowLeft size={16} />Back to patient chart</Link><header className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-wider text-teal-300">Encounter workspace</p><h1 className="mt-1 text-2xl font-bold">{encounter.patient.firstName} {encounter.patient.lastName}</h1><p className="mt-2 text-sm text-slate-300">{encounter.patient.medicalRecordNumber} · {calculateAge(encounter.patient.dateOfBirth)} years · Fictional record</p></div><Badge tone={encounter.status === "COMPLETED" ? "green" : "amber"}>{encounter.status.toLowerCase()}</Badge></div></header><EncounterWorkspace encounter={initial} /></div>;
}
