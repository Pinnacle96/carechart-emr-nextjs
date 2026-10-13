"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { patientRegistrationSchema, type PatientRegistrationInput } from "@/lib/validation/patient";
import { readApiError } from "@/lib/utils";

export function PatientRegistrationForm() {
  const router = useRouter();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<PatientRegistrationInput>({ resolver: zodResolver(patientRegistrationSchema), defaultValues: { firstName: "", lastName: "", dateOfBirth: "", sex: "", email: "", phone: "", emergencyName: "", emergencyPhone: "" } });
  const onSubmit = handleSubmit(async (values) => {
    const response = await fetch("/api/patients", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    if (!response.ok) { const issue = await readApiError(response); setError("root", { message: issue.message }); return; }
    const { patient } = await response.json();
    router.push(`/patients/${patient.id}?registered=1`);
  });
  return <form className="space-y-7" onSubmit={onSubmit} noValidate>
    {errors.root ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errors.root.message}</div> : null}
    <fieldset><legend className="text-base font-bold">Patient identity</legend><p className="mt-1 text-sm text-slate-500">Required fields are marked with an asterisk.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="First name *" htmlFor="firstName" error={errors.firstName?.message}><Input id="firstName" autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? "firstName-error" : undefined} {...register("firstName")} /></Field><Field label="Last name *" htmlFor="lastName" error={errors.lastName?.message}><Input id="lastName" autoComplete="family-name" aria-invalid={Boolean(errors.lastName)} aria-describedby={errors.lastName ? "lastName-error" : undefined} {...register("lastName")} /></Field><Field label="Date of birth *" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}><Input id="dateOfBirth" type="date" aria-invalid={Boolean(errors.dateOfBirth)} aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined} {...register("dateOfBirth")} /></Field><Field label="Sex recorded in demo" htmlFor="sex" error={errors.sex?.message}><select id="sex" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" {...register("sex")}><option value="">Not provided</option><option>Female</option><option>Male</option><option>Intersex</option><option>Not recorded</option></select></Field></div></fieldset>
    <fieldset><legend className="text-base font-bold">Contact details</legend><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Email" htmlFor="email" error={errors.email?.message} hint="Use fictional data only."><Input id="email" type="email" autoComplete="off" aria-invalid={Boolean(errors.email)} {...register("email")} /></Field><Field label="Phone" htmlFor="phone" error={errors.phone?.message}><Input id="phone" type="tel" autoComplete="off" {...register("phone")} /></Field></div></fieldset>
    <fieldset><legend className="text-base font-bold">Emergency contact</legend><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Contact name" htmlFor="emergencyName" error={errors.emergencyName?.message}><Input id="emergencyName" autoComplete="off" aria-invalid={Boolean(errors.emergencyName)} {...register("emergencyName")} /></Field><Field label="Contact phone" htmlFor="emergencyPhone" error={errors.emergencyPhone?.message}><Input id="emergencyPhone" type="tel" autoComplete="off" {...register("emergencyPhone")} /></Field></div></fieldset>
    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Registering…" : "Register fictional patient"}</Button></div>
  </form>;
}
