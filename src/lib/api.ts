import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Check the highlighted information and try again.", details: error.flatten() } },
      { status: 422 },
    );
  }
  console.error("CareChart request failed", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "The request could not be completed. Please try again." } },
    { status: 500 },
  );
}
