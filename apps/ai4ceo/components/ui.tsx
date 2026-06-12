import type { ReactNode } from "react";

type Tone =
  | "read"
  | "edit"
  | "warn"
  | "done"
  | "due"
  | "review"
  | "private"
  | "public";

const dotColor: Record<Tone, string> = {
  read: "bg-muted",
  edit: "bg-primary",
  warn: "bg-warning",
  done: "bg-success",
  due: "bg-accent",
  review: "bg-info",
  private: "bg-muted",
  public: "bg-primary",
};

export function Badge({
  tone = "read",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[tone]}`} />
      {children}
    </span>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "softcta";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-primary text-white border-primary-hover hover:bg-primary-hover",
  secondary:
    "bg-surface text-ink border-[#A9BFD6] hover:bg-surface-muted hover:border-[#8FACC9]",
  ghost:
    "bg-transparent text-primary border-[#BCD0E4] hover:bg-surface-muted hover:border-[#A9BFD6]",
  softcta:
    "bg-surface text-ink border-[#A9BFD6] hover:bg-primary hover:text-white hover:border-primary-hover active:bg-primary active:text-white active:border-primary-hover",
};

export function Button({
  variant = "secondary",
  children,
}: {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex min-h-10 items-center gap-2 rounded-control border px-4 text-sm font-semibold transition-colors ${variantClass[variant]}`}
    >
      {children}
    </button>
  );
}
