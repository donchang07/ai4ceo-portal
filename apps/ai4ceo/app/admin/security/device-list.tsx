"use client";

import { useState, useTransition } from "react";
import { Laptop } from "lucide-react";
import { Button, Callout, Card, CardTitle } from "@/components/ui";
import type { AdminDevice } from "@/lib/db/admin-device";
import { revokeDevice } from "./actions";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function DeviceList({ devices, guardEnabled }: { devices: AdminDevice[]; guardEnabled: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function revoke(id: string, label: string) {
    if (!confirm(`'${label}' 기기의 등록을 해지할까요? 해당 기기에서는 관리자 화면에 들어올 수 없게 됩니다.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await revokeDevice(id);
      if (!result.ok) setError(result.error ?? "해지에 실패했습니다.");
    });
  }

  return (
    <Card>
      <CardTitle>등록된 기기</CardTitle>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {guardEnabled
          ? "아래 기기에서만 관리자 화면이 열립니다."
          : "기기 잠금이 아직 꺼져 있습니다(ADMIN_DEVICE_GUARD=off). 등록을 마친 뒤 켜세요."}
      </p>

      <div className="mt-4 space-y-2">
        {devices.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between gap-4 rounded-[12px] border border-hairline px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-info-surface text-primary">
                <Laptop size={17} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{d.label}</p>
                <p className="truncate text-xs text-faint">
                  등록 {formatDate(d.created_at)} · 최근 사용 {formatDate(d.last_seen_at)}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => revoke(d.id, d.label)}>
              해지
            </Button>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="rounded-[12px] border border-hairline px-4 py-8 text-center text-sm text-muted">
            아직 등록된 기기가 없습니다.
          </div>
        )}
      </div>

      {error && <Callout className="mt-4">{error}</Callout>}

      <p className="mt-4 text-xs leading-relaxed text-faint">
        새 기기를 추가하려면 그 기기에서 /admin-device 에 접속해 등록 코드를 입력하세요.
      </p>
    </Card>
  );
}
