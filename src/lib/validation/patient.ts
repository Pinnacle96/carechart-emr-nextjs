import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(120)
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

export const patientRegistrationSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(60),
    lastName: z.string().trim().min(1, "Last name is required").max(60),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value, "Enter a valid date")
      .refine((value) => new Date(`${value}T12:00:00Z`) <= new Date(), "Date of birth cannot be in the future"),
    sex: z.enum(["Female", "Male", "Intersex", "Not recorded"]).optional().or(z.literal("")),
    email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
    phone: optionalText,
    emergencyName: optionalText,
    emergencyPhone: optionalText,
  })
  .refine(
    (data) => !data.emergencyPhone || Boolean(data.emergencyName),
    { path: ["emergencyName"], message: "Add a contact name when a phone number is provided" },
  );

export type PatientRegistrationInput = z.input<typeof patientRegistrationSchema>;
