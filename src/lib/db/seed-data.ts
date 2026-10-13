import { addDays, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import type { PrismaClient } from "@prisma/client";
import { LOCAL_DEMO_SESSION_KEY } from "@/lib/constants";

const people = [
  ["Amara", "Dovetail"], ["Jonah", "Northstar"], ["Lena", "Marigold"], ["Theo", "Evergreen"],
  ["Maya", "Silverleaf"], ["Ezra", "Bluehaven"], ["Nia", "Westbrook"], ["Owen", "Fairlight"],
  ["Iris", "Meadoway"], ["Caleb", "Brighton"], ["Zara", "Pinecrest"], ["Miles", "Cloudwell"],
  ["Asha", "Redfern"], ["Felix", "Oakmere"], ["Lila", "Sunfield"], ["Micah", "Riverstone"],
  ["Sana", "Willowby"], ["Eli", "Frostvale"], ["Ada", "Clearwater"], ["Noel", "Rosebank"],
  ["Talia", "Greenmoor"], ["Isaac", "Harborlight"], ["Mira", "Ashgrove"], ["Levi", "Springpath"],
  ["Kemi", "Cedarline"], ["Hugo", "Mapleford"], ["Rina", "Goldcrest"], ["Sam", "Hillgarden"],
  ["Yara", "Brookfield"], ["Joel", "Starling"],
] as const;

const reasons = ["Routine follow-up", "Review of recent symptoms", "Annual wellness visit", "Medication history review"];

export async function resetDemoData(client: PrismaClient) {
  await client.demoSession.deleteMany({ where: { sessionKey: LOCAL_DEMO_SESSION_KEY } });

  const session = await client.demoSession.create({ data: { sessionKey: LOCAL_DEMO_SESSION_KEY } });
  const patients = [];

  for (let index = 0; index < people.length; index += 1) {
    const [firstName, lastName] = people[index];
    const allergyStatus = index % 3 === 0 ? "KNOWN" : index % 3 === 1 ? "NONE_KNOWN" : "NOT_RECORDED";
    const patient = await client.patient.create({
      data: {
        demoSessionId: session.id,
        medicalRecordNumber: `CC-${String(index + 1).padStart(6, "0")}`,
        firstName,
        lastName,
        dateOfBirth: new Date(Date.UTC(1948 + ((index * 7) % 62), (index * 3) % 12, 2 + (index % 25), 12)),
        sex: index % 4 === 3 ? null : index % 2 === 0 ? "Female" : "Male",
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: index % 5 === 0 ? null : `+1 555 01${String(index).padStart(2, "0")}`,
        emergencyName: index % 4 === 0 ? `Demo Contact ${index + 1}` : null,
        emergencyPhone: index % 4 === 0 ? `+1 555 90${String(index).padStart(2, "0")}` : null,
        status: index === 28 ? "INACTIVE" : "ACTIVE",
        allergyStatus,
        allergies: allergyStatus === "KNOWN" ? { create: [{ name: `Demo allergen ${String.fromCharCode(65 + (index % 4))}`, reaction: "Fictional recorded reaction" }] } : undefined,
        conditions: index % 4 === 0 ? { create: [{ name: "Demo chronic condition", status: "Active" }] } : undefined,
        medications: index % 5 === 0 ? { create: [{ name: "Demo historical medicine", details: "Fictional record — no dosage", status: "Current" }] } : undefined,
      },
    });
    patients.push(patient);
  }

  const today = startOfDay(new Date());

  for (let index = 0; index < 12; index += 1) {
    const appointmentDay = index < 8 ? today : addDays(today, 1);
    const startsAt = setMinutes(setHours(appointmentDay, 8 + (index % 8)), index % 2 === 0 ? 0 : 30);
    const status = index === 0 ? "COMPLETED" : index === 1 ? "CHECKED_IN" : index === 7 ? "CANCELLED" : "SCHEDULED";
    const appointment = await client.appointment.create({
      data: {
        demoSessionId: session.id,
        patientId: patients[index].id,
        startsAt,
        visitReason: reasons[index % reasons.length],
        status,
      },
    });

    if (index === 0) {
      await client.encounter.create({
        data: {
          demoSessionId: session.id,
          patientId: patients[index].id,
          appointmentId: appointment.id,
          status: "COMPLETED",
          revision: 2,
          visitReason: appointment.visitReason,
          subjective: "Fictional patient history recorded for the portfolio demo.",
          objective: "Demonstration observation only.",
          assessment: "Demo assessment recorded.",
          plan: "Demo follow-up plan recorded.",
          completedAt: subDays(new Date(), 1),
          orders: { create: [{ type: "LAB", catalogKey: "demo-lab-panel", itemName: "Demo wellness panel", status: "ORDERED" }] },
        },
      });
    }
    if (index === 1) {
      await client.encounter.create({
        data: {
          demoSessionId: session.id,
          patientId: patients[index].id,
          appointmentId: appointment.id,
          visitReason: appointment.visitReason,
          subjective: "Draft text retained between visits.",
        },
      });
    }
  }

  for (let index = 2; index < 16; index += 1) {
    await client.encounter.create({
      data: {
        demoSessionId: session.id,
        patientId: patients[index].id,
        status: index % 7 === 0 ? "DRAFT" : "COMPLETED",
        revision: 1,
        visitReason: reasons[index % reasons.length],
        subjective: "Fictional historical note.",
        objective: index % 3 === 0 ? "Demonstration observation." : "",
        assessment: "Demo assessment.",
        plan: "Demo plan.",
        completedAt: index % 7 === 0 ? null : subDays(new Date(), index + 2),
      },
    });
  }

  return { sessionId: session.id, patientCount: patients.length };
}
