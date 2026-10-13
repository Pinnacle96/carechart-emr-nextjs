import { NextResponse } from "next/server";
import { appointmentStatusSchema } from "@/lib/validation/appointment";
import { jsonError, AppError } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { getDemoSession } from "@/lib/db/session";

export async function PATCH(request: Request, context: { params: Promise<{ appointmentId: string }> }) {
  try {
    const session = await getDemoSession(prisma);
    const { appointmentId } = await context.params;
    const input = appointmentStatusSchema.parse(await request.json());
    const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, demoSessionId: session.id }, include: { encounter: true } });
    if (!appointment) throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Appointment was not found.");
    if (input.status === "COMPLETED" && appointment.encounter?.status !== "COMPLETED") {
      throw new AppError(422, "ENCOUNTER_REQUIRED", "Complete the linked encounter to mark this appointment completed.");
    }
    if (appointment.status === "COMPLETED" && input.status !== "COMPLETED") {
      throw new AppError(409, "APPOINTMENT_COMPLETED", "A completed appointment cannot be reopened in this demo.");
    }
    const updated = await prisma.appointment.update({ where: { id: appointmentId }, data: { status: input.status } });
    return NextResponse.json({ appointment: updated });
  } catch (error) {
    return jsonError(error);
  }
}
