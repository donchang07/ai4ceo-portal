import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/core/cn";

/* ---------------- Badge (status dot) ---------------- */
export type Tone = "progress" | "done" | "wait" | "danger" | "info" | "neutral";

const dotColor: Record<Tone, string> = {
  progress: "bg-primary",
  done: "bg-success",
  wait: "bg-warning",
  danger: "bg-danger",
  info: "bg-accent",
  neutral: "bg-faint",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-2.5 py-0.5 text-xs font-medium text-ink",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColor[tone])} />
      {children}
    </span>
  );
}

export function RoleBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-primary", className)}>
      {children}
    </span>
  );
}

/* ---------------- Button ---------------- */
type Variant = "primary" | "secondary" | "outline" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-white border-primary-hover hover:bg-primary-hover shadow-[0_8px_20px_rgba(44,92,230,.25)]",
  secondary: "bg-surface text-ink border-cardline hover:bg-surface-muted",
  outline: "bg-surface text-primary border-primary hover:bg-info-surface",
  ghost: "bg-transparent text-muted border-transparent hover:bg-surface-muted",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
  full?: boolean;
}

export function Button({ variant = "secondary", href, full, className, children, ...props }: ButtonProps) {
  const cls = cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-50",
    full && "w-full",
    variantClass[variant],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[15px] border border-hairline bg-surface p-5", className)}>{children}</div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-base font-semibold text-ink", className)}>{children}</h3>;
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-[22px] font-bold tracking-tight text-ink", className)}>{children}</h2>;
}

/* ---------------- Inputs ---------------- */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-10 w-full rounded-control border border-cardline bg-surface px-3 text-sm text-ink outline-none placeholder:text-faint focus:border-primary focus:shadow-[0_0_0_4px_rgba(44,92,230,.07)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-control border border-cardline bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-primary focus:shadow-[0_0_0_4px_rgba(44,92,230,.07)]",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------- Chip / Pill ---------------- */
export function Chip({
  active,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
        active ? "border-primary bg-primary text-white" : "border-cardline bg-surface text-muted hover:bg-surface-muted",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- Callout ---------------- */
export function Callout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex gap-2 rounded-control border border-cardline bg-info-surface px-4 py-3 text-[13px] text-info", className)}>
      {children}
    </div>
  );
}

/* ---------------- Progress ---------------- */
export function Progress({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-muted", className)}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
