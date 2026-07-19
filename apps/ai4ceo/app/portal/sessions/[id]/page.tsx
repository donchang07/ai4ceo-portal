import Link from "next/link";
import { Play, Lock, FileText, Download, ClipboardList, ChevronRight } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle } from "@/components/ui";
import { getSession, getMaterials, getAssignments } from "@/lib/db/queries";
import { requireArchiveAccess } from "@/lib/db/auth";
import { QaPanel } from "./qa-panel";

function fmtRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const w = ["일", "월", "화", "수", "목", "금", "토"][s.getDay()];
  const t = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${s.getFullYear()}년 ${s.getMonth() + 1}월 ${s.getDate()}일(${w}) ${t(s)}–${t(e)}`;
}

export default async function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireArchiveAccess();
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return (
      <PortalShell title="세션">
        <p className="text-sm text-muted">세션을 찾을 수 없습니다.</p>
      </PortalShell>
    );
  }
  const [materials, assignments] = await Promise.all([getMaterials(session.id), getAssignments()]);
  const linkedAssignment = assignments[0];

  return (
    <PortalShell title="세션 상세">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
        <Link href="/portal/cohort" className="hover:text-ink">
          Cohort Home
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink">세션</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        {/* Left */}
        <div className="flex flex-col gap-5">
          {/* Session header */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="wait">출석 예정</Badge>
              <span className="text-xs text-muted">{fmtRange(session.starts_at, session.ends_at)}</span>
            </div>
            <h1 className="mt-2 text-[22px] font-bold tracking-tight text-ink">
              {session.week_no}주차 · {session.title}
            </h1>
            {session.description ? (
              <p className="mt-1.5 text-sm text-muted">{session.description}</p>
            ) : null}
          </div>

          {/* Video player placeholder */}
          <div className="relative aspect-video overflow-hidden rounded-[15px] bg-dark">
            <div className="absolute right-3 top-3">
              <Badge tone="neutral" className="bg-surface/90">
                <Lock size={12} className="text-muted" /> Google Drive · 읽기 전용
              </Badge>
            </div>
            <div className="grid h-full w-full place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
                <Play size={28} className="ml-1" />
              </span>
            </div>
            <div className="absolute inset-x-4 bottom-4">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-1/3 rounded-full bg-white" />
              </div>
            </div>
          </div>

          {/* Materials */}
          <Card>
            <CardTitle>강의자료</CardTitle>
            <ul className="mt-3 divide-y divide-hairline">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <FileText size={18} className="shrink-0 text-info" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{m.title}</div>
                  </div>
                  {m.version ? <span className="text-xs text-muted tnum">v{m.version}</span> : null}
                  <Link
                    href={m.file_path}
                    className="grid h-9 w-9 place-items-center rounded-control border border-cardline text-ink hover:bg-surface-muted"
                    aria-label="다운로드"
                  >
                    <Download size={16} />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              자료 교체됨 —{" "}
              <button className="font-medium text-primary hover:underline">변경 이력 보기</button>
            </p>
          </Card>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-5">
          <QaPanel />

          {/* Linked assignment */}
          {linkedAssignment ? (
            <Card>
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-muted" />
                <CardTitle>연결된 과제</CardTitle>
              </div>
              <div className="mt-3 text-sm font-semibold text-ink">{linkedAssignment.title}</div>
              <p className="mt-1 text-xs text-muted">{linkedAssignment.description}</p>
              <div className="mt-4">
                <Button variant="outline" href="/portal/assignments" full>
                  과제 확인하기
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </PortalShell>
  );
}
