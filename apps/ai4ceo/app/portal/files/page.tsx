import { FileText, Download, ShieldCheck, Video, ClipboardList, MessageSquare, Lock } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, Callout } from "@/components/ui";

const folders = [
  { name: "대화방 공유", purpose: "chat_shared", icon: MessageSquare, count: 12, badge: "참여자 읽기/쓰기", tone: "progress" as const },
  { name: "강의 영상", purpose: "lecture_video", icon: Video, count: 5, badge: "읽기 전용", tone: "neutral" as const },
  { name: "과제", purpose: "assignment", icon: ClipboardList, count: 8, badge: "참여자 읽기/쓰기", tone: "progress" as const },
  { name: "관리자", purpose: "admin_only", icon: Lock, count: 3, badge: "관리자만", tone: "neutral" as const },
];

const files = [
  { name: "3주차_실습_가이드.pdf", size: "12.8 MB", updated: "오늘 09:12", badge: "읽기 전용" },
  { name: "2주차_강의_녹화본.mp4", size: "318 MB", updated: "9월 14일", badge: "읽기 전용" },
  { name: "회사적용_체크리스트.xlsx", size: "88 KB", updated: "9월 12일", badge: "참여자 읽기/쓰기" },
];

export default function FilesPage() {
  return (
    <PortalShell title="자료">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">자료</h1>
          <p className="text-sm text-muted">기수별 Google Drive 폴더와 파일을 권한과 함께 봅니다.</p>
        </div>
        <Button variant="secondary">파일 올리기</Button>
      </div>

      <Callout className="mb-5">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-success" />
        모든 폴더 권한이 정상 동기화되었습니다. 마지막 확인 2분 전. (Drive 링크 기반 · 자동 업로드는 관리자 입력)
      </Callout>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {folders.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.purpose}>
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-surface-muted text-primary">
                  <Icon size={18} />
                </span>
                <Badge tone={f.tone}>{f.badge}</Badge>
              </div>
              <div className="font-semibold text-ink">{f.name}</div>
              <div className="mt-0.5 font-mono text-xs text-faint">{f.purpose}</div>
              <div className="mt-2 text-[13px] text-muted">파일 {f.count}개</div>
            </Card>
          );
        })}
      </div>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">강의 영상 폴더</div>
      <Card className="overflow-hidden p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 text-left font-semibold">파일</th>
              <th className="px-4 py-3 text-left font-semibold">권한</th>
              <th className="px-4 py-3 text-left font-semibold">크기</th>
              <th className="px-4 py-3 text-left font-semibold">수정일</th>
              <th className="px-4 py-3 text-right font-semibold">액션</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, i) => (
              <tr key={i} className="border-t border-hairline hover:bg-surface-muted">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 text-ink">
                    <FileText size={18} className="text-info" /> {file.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">{file.badge}</Badge>
                </td>
                <td className="px-4 py-3 text-muted">{file.size}</td>
                <td className="px-4 py-3 text-muted">{file.updated}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button className="rounded-control border border-cardline p-2 text-ink hover:bg-surface-muted" aria-label="다운로드">
                      <Download size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PortalShell>
  );
}
