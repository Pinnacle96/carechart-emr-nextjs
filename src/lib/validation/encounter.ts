import { z } from "zod";
import { COMPLETION_REQUIRED_FIELDS, LAB_CATALOGUE, MEDICATION_CATALOGUE } from "@/lib/constants";

const optionalNumber = z
  .union([z.number(), z.nan(), z.null()])
  .transform((value) => (typeof value === "number" && !Number.isNaN(value) ? value : null))
  .refine((value) => value === null || value >= 0, "Enter zero or a positive number");

const catalogueKeys = new Set<string>([
  ...MEDICATION_CATALOGUE.map((item) => item.key),
  ...LAB_CATALOGUE.map((item) => item.key),
]);

export const encounterOrderSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["MEDICATION", "LAB"]),
  catalogKey: z.string().refine((value) => catalogueKeys.has(value), "Select a demo catalogue item"),
  itemName: z.string().trim().min(1).max(120),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
}).superRefine((order, context) => {
  const catalogue = order.type === "MEDICATION" ? MEDICATION_CATALOGUE : LAB_CATALOGUE;
  const item = catalogue.find((entry) => entry.key === order.catalogKey);
  if (!item || item.name !== order.itemName) {
    context.addIssue({ code: "custom", path: ["catalogKey"], message: "Choose a matching item from the demo catalogue" });
  }
});

export const encounterDraftSchema = z.object({
  revision: z.number().int().min(0),
  visitReason: z.string().trim().max(500),
  bloodPressure: z
    .string()
    .trim()
    .max(20)
    .refine((value) => value === "" || /^\d{2,3}\/\d{2,3}$/.test(value), "Use a format such as 120/80"),
  heartRate: optionalNumber,
  temperature: optionalNumber,
  respiratoryRate: optionalNumber,
  oxygenSaturation: optionalNumber,
  weight: optionalNumber,
  height: optionalNumber,
  subjective: z.string().trim().max(5000),
  objective: z.string().trim().max(5000),
  assessment: z.string().trim().max(5000),
  plan: z.string().trim().max(5000),
  orders: z.array(encounterOrderSchema).max(20),
});

export const completionSchema = z.object({
  revision: z.number().int().min(0),
});

export function getCompletionErrors(data: Record<string, unknown>) {
  return COMPLETION_REQUIRED_FIELDS.flatMap((field) => {
    const value = data[field];
    return typeof value === "string" && value.trim().length > 0
      ? []
      : [{ field, message: `${field === "visitReason" ? "Visit reason" : field[0].toUpperCase() + field.slice(1)} is required to complete the encounter` }];
  });
}

export type EncounterDraftInput = z.infer<typeof encounterDraftSchema>;
