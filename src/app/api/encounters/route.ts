import { z } from "zod";
import { NextResponse } from "next/server";
import { createEncounter } from "@/features/encounters/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({ patientId: z.string().min(1), appointmentId: z.string().min(1).nullable().optional() });

export async function POST(request: Request) {
  try {
    const encounter = await createEncounter(prisma, schema.parse(await request.json()));
    return NextResponse.json({ encounter }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
