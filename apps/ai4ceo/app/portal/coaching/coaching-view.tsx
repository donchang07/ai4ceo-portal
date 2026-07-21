"use client";

import { useState, useTransition } from "react";
import { CalendarClock, MapPin, Users, Video } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle, SectionTitle } from "@/components/ui";
import { bookSession, cancelBooking } from "./actions";

// Design Ref: prd-v3-m2-booking.design.md §3 — D-12 1:1 핸즈온 코칭 예약

export interface CoachingSlot {
  id: string;
  starts_at: string;
  ends_at: string;
  place: string | null;
  zoom_url: string | null;
  capacity: number | null;
  description: string | null;
  bookedCount: number;
  myBooked: boolean;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${w}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function CoachingView({ slots }: { slots: CoachingSlot[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function book(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await bookSession(id, "T-12");
      if (!result.ok) setError(result.message);
      setBusyId(null);
    });
  }

  function cancel(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await cancelBooking(id, "/portal/coaching");
      if (!result.ok) setError(result.message);
      setBusyId(null);
    });
  }

  return (
    <PortalShell title="1:1 코칭 예약">
      <div className="mx-auto max-w-[760px]">
        <SectionTitle>1:1 핸즈온 코칭</SectionTitle>
        <p className="mt-1.5 text-sm text-muted">
          실습 중 막힌 지점을 화면공유 또는 대면으로 함께 풉니다. 비동기 질문으로 부족한
          즉시성을 코칭이 보완합니다.
        </p>

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        {slots.length === 0 ? (
          <Card className="mt-6">
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CalendarClock size={24} className="text-faint" />
              <p className="text-sm font-semibold text-ink">현재 예약 가능한 코칭 슬롯이 없습니다</p>
              <p className="max-w-sm text-[13px] text-muted">
                새 슬롯이 열리면 이 화면에 표시됩니다. 급하게 막힌 부분이 있다면 AI 조교나
                대화방에서 먼저 질문해 보세요.
              </p>
              <Button href="/portal/ai" variant="secondary" className="mt-2">
                AI 조교에게 질문하기
              </Button>
            </div>
          </Card>
        ) : (
          <div className="mt-5 space-y-3">
            {slots.map((slot) => {
              const full = slot.capacity != null && slot.bookedCount >= slot.capacity;
              const busy = pending && busyId === slot.id;
              return (
                <Card key={slot.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-ink">
                        <CalendarClock size={16} className="text-primary" />
                        <CardTitle>{fmt(slot.starts_at)}</CardTitle>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-muted">
                        {slot.zoom_url ? (
                          <span className="flex items-center gap-1"><Video size={13} /> 화면공유</span>
                        ) : null}
                        {slot.place ? (
                          <span className="flex items-center gap-1"><MapPin size={13} /> {slot.place}</span>
                        ) : null}
                        {slot.capacity != null ? (
                          <span className="flex items-center gap-1">
                            <Users size={13} /> {slot.bookedCount}/{slot.capacity}
                          </span>
                        ) : null}
                      </div>
                      {slot.description ? (
                        <p className="mt-2 text-[13px] text-muted">{slot.description}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      {slot.myBooked ? (
                        <div className="flex items-center gap-2">
                          <Badge tone="done">예약됨</Badge>
                          <Button variant="ghost" onClick={() => cancel(slot.id)} disabled={busy}>
                            취소
                          </Button>
                        </div>
                      ) : full ? (
                        <Badge tone="neutral">마감</Badge>
                      ) : (
                        <Button variant="primary" onClick={() => book(slot.id)} disabled={busy}>
                          예약하기
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
