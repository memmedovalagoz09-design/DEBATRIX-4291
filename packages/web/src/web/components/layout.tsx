import * as React from "react";
import { Link, useLocation } from "wouter";
import { Swords, Bell } from "lucide-react";
import { useMe } from "../queries/account";
import { useMyInvites } from "../queries/debates";
import { rankOf, RANK_STYLE } from "../lib/rank-ui";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Arena" },
  { to: "/canli", label: "Canlı Debatlar" },
  { to: "/liqa", label: "Universitet Liqası" },
  { to: "/profil", label: "Profilim" },
];

export function Navbar() {
  const [path] = useLocation();
  const { user } = useMe();
  const invites = useMyInvites(!!user);
  const pending = invites.data ?? [];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      {pending.length > 0 && (
        <Link
          href={`/debat/${pending[0].id}`}
          className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm font-medium text-gold hover:bg-amber-100"
        >
          <Bell className="size-4" />
          Revans dəvəti: "{pending[0].title}" — qəbul et
        </Link>
      )}
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-5 py-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white">
            <Swords className="size-4.5" />
          </span>
          <span className="leading-tight">
            <span className="block text-[17px] font-bold tracking-tight text-ink">DEBATRİX</span>
            <span className="block text-[12px] text-slate-500">Debate Arena</span>
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((n) => {
            const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                href={n.to}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-[15px] transition",
                  active ? "bg-canvas font-semibold text-ink" : "text-slate-600 hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/?yeni=1"
            className="hidden rounded-xl border border-line px-3.5 py-2 text-[15px] font-medium text-ink hover:border-slate-300 hover:bg-canvas md:inline-flex"
          >
            Mövzu Yarat
          </Link>
          {user ? (
            <Link href="/profil" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-canvas">
              <span className="hidden text-[15px] font-medium text-ink sm:inline">{user.name}</span>
              <span className={cn("rounded-full border px-2.5 py-0.5 text-[13px] font-semibold", RANK_STYLE[rankOf(user.rix)])}>
                {user.rix} RIX
              </span>
            </Link>
          ) : (
            <Link
              href="/giris"
              className="rounded-xl bg-ink px-4 py-2 text-[15px] font-medium text-white hover:bg-slate-800"
            >
              Daxil ol
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row">
        <p className="text-sm text-slate-500">DEBATRİX — Sadəcə mübahisə etmə, sübut et!</p>
        <p className="text-xs text-slate-400">
          <a
            href="https://instagram.com/web.by.alagoz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600"
          >
            BUILT BY ALAGOZ MAMMADOVA
          </a>
        </p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-5", className)}>{children}</div>;
}
