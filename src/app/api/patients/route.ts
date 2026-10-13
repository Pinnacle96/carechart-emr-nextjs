import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { registerPatient } from "@/features/patients/server";

export async function POST(request: Request) {
  try {
    const patient = await registerPatient(prisma, await request.json());
    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
