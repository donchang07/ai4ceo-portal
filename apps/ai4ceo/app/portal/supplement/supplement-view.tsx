"use client";

import { useState, useTransition } from "react";
import { CalendarClock, MapPin, Users, Info } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Callout, Card, CardTitle, SectionTitle } from "@/components/ui";
import { bookSession, cancelBooking } from "../coaching/actions";

// Design Ref: prd-v3-m2-booking.design.md §4 — D-13 오프라인 보충수업 신청

export interface SupplementSlot {
  id: string;
  week_no: number;
  title: string;
  starts_at: string;
  ends_at: string;
  place: string | null;
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

export function SupplementView({ slots }: { slots: SupplementSlot[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function apply(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await bookSession(id, "T-13");
      if (!result.ok) setError(result.message);
      setBusyId(null);
    });
  }

  function cancel(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await cancelBooking(id, "/portal/supplement");
      if (!result.ok) setError(result.message);
      setBusyId(null);
    });
  }

  return (
    <PortalShell title="오프라인 보충수업">
      <div className="mx-auto max-w-[760px]">
        <SectionTitle>오프라인 보충수업</SectionTitle>
        <Callout className="mt-3">
          <Info size={15} className="mt-0.5 shrink-0" />
          복습 위주로 진행합니다 — 질의응답, 프로그램 설치, 실행 방법, 버그 수정을
          지원하며 정규 수업 진도와는 무관합니다. 이해가 안 된 내용을 직접 질문하거나
          시연을 요청할 수 있습니다. Zoom 방송·녹화는 하지 않습니다.
        </Callout>

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        {slots.length === 0 ? (
          <Card className="mt-5">
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CalendarClock size={24} className="text-faint" />
              <p className="text-sm font-semibold text-ink">아직 공지된 보충수업 일정이 없습니다</p>
              <p className="max-w-sm text-[13px] text-muted">일정이 확정되면 이 화면과 알림톡으로 안내드립니다.</p>
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
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral">{slot.week_no > 0 ? `${slot.week_no}주차` : "보충"}</Badge>
                        <CardTitle>{slot.title}</CardTitle>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-muted">
                        <span className="flex items-center gap-1"><CalendarClock size={13} /> {fmt(slot.starts_at)}</span>
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
                          <Badge tone="done">신청됨</Badge>
                          <Button variant="ghost" onClick={() => cancel(slot.id)} disabled={busy}>
                            취소
                          </Button>
                        </div>
                      ) : full ? (
                        <Badge tone="neutral">마감</Badge>
                      ) : (
                        <Button variant="primary" onClick={() => apply(slot.id)} disabled={busy}>
                          신청하기
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
