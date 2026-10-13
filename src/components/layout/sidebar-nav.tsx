"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Menu, Users, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/patients", label: "Patients", icon: Users },
] as const;

export function SidebarNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="fixed left-4 top-3 z-40 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
        <Menu size={21} />
      </button>
      {open ? <button aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-slate-950 text-slate-100 transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500 font-black text-slate-950">C</span>
            <span><span className="block text-base font-bold tracking-tight">CareChart</span><span className="block text-[11px] text-slate-400">Clinical workspace</span></span>
          </Link>
          <button className="grid h-10 w-10 place-items-center rounded-lg hover:bg-slate-800 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Primary navigation">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition", active ? "bg-teal-500/15 text-teal-300" : "text-slate-300 hover:bg-slate-900 hover:text-white")}><Icon size={19} aria-hidden />{label}</Link>;
          })}
        </nav>
        <div className="border-t border-slate-800 p-4 text-xs leading-5 text-slate-400">
          Browser-tab portfolio demo<br />Not for clinical use
        </div>
      </aside>
    </>
  );
}
