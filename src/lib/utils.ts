import { differenceInYears, format } from "date-fns";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: Date | string | null | undefined, fallback = "Not recorded") {
  if (!value) return fallback;
  return format(new Date(value), "d MMM yyyy");
}

export function formatTime(value: Date | string) {
  return format(new Date(value), "h:mm a");
}

export function calculateAge(dateOfBirth: Date | string) {
  return differenceInYears(new Date(), new Date(dateOfBirth));
}

export async function readApiError(response: Response) {
  const payload = await response.json().catch(() => null);
  return {
    code: payload?.error?.code ?? "REQUEST_FAILED",
    message: payload?.error?.message ?? "The request could not be completed.",
    details: payload?.error?.details,
  };
}
