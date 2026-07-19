import Link from "next/link";
import { Clock, Video, MapPin, ChevronRight } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Card } from "@/components/ui";
import { getSessions } from "@/lib/db/queries";

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function SessionsPage() {
  const sessions = await getSessions();
  return (
    <PortalShell title="세션">
      <h1 className="text-xl font-bold text-ink">세션</h1>
      <p className="mb-5 text-sm text-muted">총 10회 정규 세션과 토요일 오프라인 보충 세션입니다.</p>
      <div className="flex flex-col gap-3">
        {sessions.map((s) => {
          const supplement = s.type === "offline_supplement";
          return (
            <Link key={s.id} href={`/portal/sessions/${s.id}`}>
              <Card className="flex items-start justify-between gap-4 transition-colors hover:border-border">
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    {supplement ? (
                      <Badge tone="info">보충 세션</Badge>
                    ) : (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-muted">
                        {s.week_no}주차
                      </span>
                    )}
                    {s.track ? <span className="text-xs text-faint">{s.track}</span> : null}
                  </div>
                  <div className="text-base font-semibold text-ink">{s.title}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock size={15} /> {fmt(s.starts_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {supplement ? (
                        <>
                          <MapPin size={15} /> 대면 · 별도 장소
                        </>
                      ) : (
                        <>
                          <Video size={15} /> Zoom
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="mt-1 shrink-0 text-faint" />
              </Card>
            </Link>
          );
        })}
      </div>
    </PortalShell>
  );
}
