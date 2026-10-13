"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center"><h1 className="text-xl font-bold">This view could not be loaded</h1><p className="mt-2 text-sm text-slate-600">The demo data is safe. Try loading the view again.</p><Button className="mt-5" onClick={reset}>Try again</Button></section>;
}
