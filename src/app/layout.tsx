import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ResetDemo } from "@/components/layout/reset-demo";

export const metadata: Metadata = {
  title: { default: "CareChart", template: "%s · CareChart" },
  description: "A fictional EMR workflow portfolio application by Noah Abayomi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-white px-4 py-2 font-semibold shadow focus:translate-y-0">Skip to content</a>
        <SidebarNav />
        <div className="min-h-screen lg:pl-64">
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 pl-16 backdrop-blur lg:px-8 lg:pl-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900"><span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" /><span className="sm:hidden">Demo · fictional data</span><span className="hidden sm:inline">Demo — fictional patient data · saved in this tab</span></div>
            <div className="flex items-center gap-1"><ResetDemo /><Link className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex" href="https://github.com/Pinnacle96" target="_blank" rel="noreferrer">Noah Abayomi</Link></div>
          </header>
          <main id="main-content" className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
