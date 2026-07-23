"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Check, Plus, X } from "lucide-react";
import { Badge, Button, Card, CardTitle, Chip, Input, Textarea } from "@/components/ui";
import { createSlot, setAttended } from "./actions";

// Design Ref: prd-v3-cycle4.design.md §4 — H-7. 학생 화면(/portal/coaching·/portal/supplement)의
// 슬롯을 생성하고 신청자·참석 여부를 관리하는 admin 전용 화면.

export interface SlotRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  place: string | null;
  zoom_url: string | null;
  capacity: number | null;
  description: string | null;
  type: string;
  bookings: { id: string; name: string; status: string; attended: boolean | null }[];
}

function fmt(iso: string): string {
  const d = new Date(iso);
  const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${w}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function BookingsManager({ slots }: { slots: SlotRow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [slotType, setSlotType] = useState<"coaching" | "offline_supplement">("coaching");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [place, setPlace] = useState("");
  const [zoomUrl, setZoomUrl] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createSlot({ slotType, startsAt, endsAt, place, zoomUrl, capacity, description });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setStartsAt("");
      setEndsAt("");
      setPlace("");
      setZoomUrl("");
      setCapacity("");
      setDescription("");
      setShowForm(false);
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> 슬롯 만들기
        </Button>
      </div>

      {showForm ? (
        <Card className="mt-4">
          <CardTitle>새 슬롯</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip active={slotType === "coaching"} onClick={() => setSlotType("coaching")}>
              1:1 코칭
            </Chip>
            <Chip active={slotType === "offline_supplement"} onClick={() => setSlotType("offline_supplement")}>
              오프라인 보충수업
            </Chip>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted">시작 일시</label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted">종료 일시</label>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1" />
            </div>
            <Input placeholder="장소 (대면인 경우)" value={place} onChange={(e) => setPlace(e.target.value)} />
            <Input placeholder="Zoom 링크 (화상인 경우)" value={zoomUrl} onChange={(e) => setZoomUrl(e.target.value)} />
            <Input type="number" placeholder="정원 (선택)" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <Textarea
            rows={2}
            className="mt-3"
            placeholder="설명 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={submit} disabled={pending}>
              생성
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              취소
            </Button>
          </div>
        </Card>
      ) : null}

      {slots.length === 0 ? (
        <Card className="mt-4">
          <p className="py-8 text-center text-sm text-muted">등록된 슬롯이 없습니다.</p>
        </Card>
      ) : (
        <div className="mt-5 space-y-4">
          {slots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
}

function SlotCard({ slot }: { slot: SlotRow }) {
  const [pending, startTransition] = useTransition();
  const booked = slot.bookings.filter((b) => b.status === "booked");

  function toggleAttended(bookingId: string, current: boolean | null) {
    const next = current === true ? false : current === false ? null : true;
    startTransition(async () => {
      await setAttended(bookingId, next);
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone={slot.type === "coaching" ? "info" : "neutral"}>
            {slot.type === "coaching" ? "코칭" : "보충수업"}
          </Badge>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <CalendarClock size={15} className="text-primary" /> {fmt(slot.starts_at)}
            </span>
          </CardTitle>
        </div>
        <span className="tnum text-xs text-muted">
          신청 {booked.length}
          {slot.capacity != null ? ` / ${slot.capacity}` : ""}명
        </span>
      </div>

      {booked.length === 0 ? (
        <p className="mt-3 text-sm text-muted">아직 신청자가 없습니다.</p>
      ) : (
        <ul className="mt-3 divide-y divide-hairline">
          {booked.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink">{b.name}</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleAttended(b.id, b.attended)}
                  disabled={pending}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    b.attended === true
                      ? "border-success bg-success/10 text-success"
                      : b.attended === false
                        ? "border-danger bg-danger/10 text-danger"
                        : "border-cardline text-muted"
                  }`}
                >
                  {b.attended === true ? <Check size={12} /> : b.attended === false ? <X size={12} /> : null}
                  {b.attended === true ? "참석" : b.attended === false ? "불참" : "미정"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
