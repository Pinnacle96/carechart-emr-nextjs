import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { resetDemoData } from "@/lib/db/seed-data";

const schema = z.object({ confirm: z.literal("RESET") });

export async function POST(request: Request) {
  try {
    schema.parse(await request.json());
    const result = await resetDemoData(prisma);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
