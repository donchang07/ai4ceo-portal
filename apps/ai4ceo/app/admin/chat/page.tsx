import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { getChatRoomSummaries } from "@/lib/db/queries";

// Design Ref: PRD §7.2 /admin/chat — 기수별 대화방 관리·파일 권한 (모듈 D-16/D-18)
function formatAt(value: string | null) {
  if (!value) return "대화 없음";
  return new Date(value).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminChatPage() {
  const rooms = await getChatRoomSummaries();
  const totalMessages = rooms.reduce((sum, r) => sum + r.messages, 0);
  const totalFiles = rooms.reduce((sum, r) => sum + r.files, 0);

  return (
    <AdminShell>
      <SectionTitle>대화방 관리</SectionTitle>
      <p className="mt-1 text-sm text-muted">
        기수별 대화방의 참여자·대화량·공유 파일과 연결된 Drive 폴더를 확인합니다.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-muted">대화방</div>
          <div className="mt-1 text-2xl font-bold">{rooms.length}개</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">누적 대화</div>
          <div className="mt-1 text-2xl font-bold">{totalMessages}건</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">공유 파일</div>
          <div className="mt-1 text-2xl font-bold">{totalFiles}개</div>
        </Card>
      </div>

      <div className="mt-6 grid gap-3">
        {rooms.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{r.title ?? "제목 없는 대화방"}</span>
              {r.cohort_name && <Badge tone="info">{r.cohort_name}</Badge>}
              <Badge tone={r.status === "open" ? "done" : "neutral"}>
                {r.status === "open" ? "열림" : "닫힘"}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span>참여자 {r.members}명</span>
              <span>대화 {r.messages}건</span>
              <span>파일 {r.files}개</span>
              <span>최근 대화 {formatAt(r.last_message_at)}</span>
            </div>
            {r.google_drive_folder_url && (
              <Link
                href={r.google_drive_folder_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Drive 폴더 열기
              </Link>
            )}
          </Card>
        ))}
        {rooms.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">개설된 대화방이 없습니다.</p>
        )}
      </div>
    </AdminShell>
  );
}
