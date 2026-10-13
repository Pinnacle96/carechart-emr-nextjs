import { z } from "zod";

export const appointmentStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "CHECKED_IN", "COMPLETED", "CANCELLED"]),
});
