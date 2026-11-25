import * as React from "react";
import { cn } from "@/lib/utils";

/** Section header with a faded artwork banner blended into the white background. */
export function BannerHeader({
  image,
  position = "center",
  eyebrow,
  title,
  subtitle,
  children,
}: {
  image: string;
  position?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-line bg-white">
      <img
        src={image}
        alt=""
        aria-hidden
        className={cn("absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.22]")}
        style={{ objectPosition: position }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/70 via-white/85 to-white" />
      <div className="px-6 py-10 sm:px-10 sm:py-12">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-violet">{eyebrow}</p>}
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 max-w-2xl text-base text-slate-600">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
