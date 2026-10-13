import { z } from "zod";
import { NextResponse } from "next/server";
import { completeEncounter } from "@/features/encounters/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({ patientId: z.string().min(1), revision: z.number().int().min(0) });

export async function POST(request: Request, context: { params: Promise<{ encounterId: string }> }) {
  try {
    const { encounterId } = await context.params;
    const input = schema.parse(await request.json());
    const encounter = await completeEncounter(prisma, encounterId, input.patientId, input.revision);
    return NextResponse.json({ encounter });
  } catch (error) {
    return jsonError(error);
  }
}
