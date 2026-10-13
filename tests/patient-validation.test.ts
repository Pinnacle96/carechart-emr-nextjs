import { describe, expect, it } from "vitest";
import { patientRegistrationSchema } from "@/lib/validation/patient";

describe("patient registration validation", () => {
  it("accepts the required identity fields and normalizes empty optionals", () => {
    const result = patientRegistrationSchema.parse({ firstName: "  Rowan ", lastName: " Example ", dateOfBirth: "1990-06-10", email: "", phone: "" });
    expect(result).toMatchObject({ firstName: "Rowan", lastName: "Example", dateOfBirth: "1990-06-10", phone: undefined });
  });

  it("rejects missing names, future dates, invalid emails, and incomplete emergency contacts", () => {
    const result = patientRegistrationSchema.safeParse({ firstName: "", lastName: "", dateOfBirth: "2999-01-01", email: "not-an-email", emergencyPhone: "555" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining(["firstName", "lastName", "dateOfBirth", "email", "emergencyName"]));
  });

  it("rejects calendar dates that JavaScript would silently roll forward", () => {
    const result = patientRegistrationSchema.safeParse({ firstName: "Rowan", lastName: "Example", dateOfBirth: "2024-02-30" });
    expect(result.success).toBe(false);
  });
});
