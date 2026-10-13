import { NewEncounter } from "@/features/encounters/new-encounter";

export default async function NewEncounterPage({ params }: { params: Promise<{ patientId: string }> }) { const { patientId } = await params; return <NewEncounter patientId={patientId} />; }
