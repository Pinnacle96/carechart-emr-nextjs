import { z } from "zod";
import { NextResponse } from "next/server";
import { saveEncounterDraft } from "@/features/encounters/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";

const requestSchema = z.object({ patientId: z.string().min(1), draft: z.unknown() });

export async function PUT(request: Request, context: { params: Promise<{ encounterId: string }> }) {
  try {
    const { encounterId } = await context.params;
    const body = requestSchema.parse(await request.json());
    const encounter = await saveEncounterDraft(prisma, encounterId, body.patientId, body.draft as never);
    return NextResponse.json({ encounter });
  } catch (error) {
    return jsonError(error);
  }
}
