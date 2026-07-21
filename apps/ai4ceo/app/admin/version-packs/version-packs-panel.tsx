"use client";

import { useTransition } from "react";
import { Lock, Unlock, Package } from "lucide-react";
import { Badge, Button, Card, CardTitle } from "@/components/ui";
import { toggleLock } from "./actions";

// Design Ref: prd-v3-cycle4.design.md §5

export interface PackRow {
  id: string;
  version_label: string;
  locked_at: string | null;
  change_summary: string | null;
  created_at: string;
  cohorts: { name: string } | null;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function VersionPacksPanel({ packs }: { packs: PackRow[] }) {
  const [pending, startTransition] = useTransition();

  function toggle(id: string, locked: boolean) {
    startTransition(async () => {
      await toggleLock(id, locked);
    });
  }

  if (packs.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-muted">등록된 버전 팩이 없습니다.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {packs.map((p) => {
        const locked = Boolean(p.locked_at);
        return (
          <Card key={p.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-primary" />
                <CardTitle>
                  {p.cohorts?.name ?? "미지정 기수"} · {p.version_label}
                </CardTitle>
                <Badge tone={locked ? "done" : "wait"}>{locked ? `잠김 · ${fmt(p.locked_at!)}` : "미잠금"}</Badge>
              </div>
              <Button variant={locked ? "secondary" : "primary"} onClick={() => toggle(p.id, locked)} disabled={pending}>
                {locked ? (
                  <>
                    <Unlock size={14} /> 잠금 해제
                  </>
                ) : (
                  <>
                    <Lock size={14} /> 잠그기
                  </>
                )}
              </Button>
            </div>
            {p.change_summary ? <p className="mt-2 text-[13px] text-muted">{p.change_summary}</p> : null}
            <p className="mt-1 text-xs text-faint">생성 {fmt(p.created_at)}</p>
          </Card>
        );
      })}
    </div>
  );
}
