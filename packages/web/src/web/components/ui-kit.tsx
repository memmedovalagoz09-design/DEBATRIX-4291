import * as React from "react";
import { X } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type BtnVariant = "ink" | "pro" | "con" | "gold" | "outline" | "ghost" | "danger";

const BTN: Record<BtnVariant, string> = {
  ink: "bg-ink text-white hover:bg-slate-800",
  pro: "bg-pro text-white hover:bg-blue-700",
  con: "bg-con text-white hover:bg-red-700",
  gold: "bg-gold text-white hover:bg-amber-700",
  outline: "border border-line bg-white text-ink hover:border-slate-300 hover:bg-canvas",
  ghost: "text-slate-600 hover:bg-canvas hover:text-ink",
  danger: "bg-con text-white hover:bg-red-700",
};

export function Btn({
  variant = "ink",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-9 px-3.5 text-sm",
        size === "md" && "h-11 px-5 text-[15px]",
        size === "lg" && "h-12 px-6 text-base",
        BTN[variant],
        className,
      )}
    />
  );
}

export function LinkBtn({
  to,
  children,
  variant = "ink",
  size = "md",
  className,
}: {
  to: string;
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <Link
      href={to}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition",
        size === "sm" && "h-9 px-3.5 text-sm",
        size === "md" && "h-11 px-5 text-[15px]",
        size === "lg" && "h-12 px-6 text-base",
        BTN[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Client-side navigation without importing wouter everywhere. */
export function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("rounded-2xl border border-line bg-white shadow-sm", className)}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-white px-4 text-[15px] text-ink outline-none placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-blue-100",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-blue-100",
        props.className,
      )}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="block text-[13px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-con">{children}</p>;
}

export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-[15px] text-slate-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: "slate" | "pro" | "con" | "gold" | "violet" | "live";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    pro: "bg-blue-50 text-pro",
    con: "bg-red-50 text-con",
    gold: "bg-amber-50 text-gold",
    violet: "bg-violet-50 text-violet",
    live: "bg-red-50 text-con",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center">
      <button type="button" tabIndex={-1} aria-label="Bağla" className="absolute inset-0 cursor-default" onClick={onClose} />
      <dialog
        open
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative my-8 w-full rounded-2xl border border-line bg-white p-6 shadow-xl sm:p-7",
          wide ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Bağla"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-canvas hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </dialog>
    </div>
  );
}

export function Spinner({ label = "Yüklənir..." }: { label?: string }) {
  return <p className="py-10 text-center text-[15px] text-slate-500">{label}</p>;
}
