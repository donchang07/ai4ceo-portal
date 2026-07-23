"use client";

import { useState } from "react";

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="mt-4 divide-y divide-hairline rounded-[15px] border border-hairline bg-surface">
      {items.map((item, index) => {
        const expanded = open.has(index);
        return (
          <div key={item.q} className="px-5 py-4">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`program-faq-${index}`}
              className="flex min-h-11 w-full items-center justify-between gap-4 text-left text-sm font-semibold text-ink"
              onClick={() => toggle(index)}
            >
              {item.q}
              <span aria-hidden="true" className="text-primary">{expanded ? "−" : "+"}</span>
            </button>
            {expanded && (
              <p id={`program-faq-${index}`} className="mt-1.5 text-sm text-muted">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
