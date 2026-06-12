import { AppShell } from "@/components/app-shell";
import { Badge, Button } from "@/components/ui";
import {
  FileText,
  Download,
  Upload,
  ShieldCheck,
  Video,
  ClipboardList,
  MessagesSquare,
  Lock,
} from "lucide-react";

type Tone = "read" | "edit" | "private";

const folders: {
  name: string;
  purpose: string;
  icon: React.ReactNode;
  count: number;
  tone: Tone;
  badge: string;
}[] = [
  { name: "대화방 공유", purpose: "chat_shared", icon: <MessagesSquare size={18} />, count: 12, tone: "edit", badge: "함께 수정" },
  { name: "강의 영상", purpose: "lecture_video", icon: <Video size={18} />, count: 5, tone: "read", badge: "읽기 전용" },
  { name: "과제", purpose: "assignment", icon: <ClipboardList size={18} />, count: 8, tone: "edit", badge: "함께 수정" },
  { name: "관리자", purpose: "admin_only", icon: <Lock size={18} />, count: 3, tone: "private", badge: "관리자만" },
];

const files: { name: string; size: string; updated: string; tone: Tone; badge: string }[] = [
  { name: "5주차_보고서_자동화_실습.pdf", size: "2.4 MB", updated: "오늘 09:12", tone: "read", badge: "읽기 전용" },
  { name: "4주차_강의_녹화본.mp4", size: "318 MB", updated: "6월 7일", tone: "read", badge: "읽기 전용" },
  { name: "회사적용_체크리스트.xlsx", size: "88 KB", updated: "6월 5일", tone: "edit", badge: "함께 수정" },
];

export default function FilesPage() {
  return (
    <AppShell>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">자료</h1>
          <p className="text-sm text-muted">
            기수별 Google Drive 폴더와 파일을 권한과 함께 봅니다.
          </p>
        </div>
        <Button variant="softcta">
          <Upload size={16} /> 파일 올리기
        </Button>
      </div>

      {/* Permission sync banner */}
      <div className="mb-5 flex items-center gap-2 rounded-control border border-[#C6D8EA] bg-info-surface px-3 py-2 text-[13px] text-ink">
        <ShieldCheck size={16} className="text-success" />
        모든 폴더 권한이 정상 동기화되었습니다. 마지막 확인 2분 전.
      </div>

      {/* Folders */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {folders.map((f) => (
          <div key={f.purpose} className="rounded-card border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-muted text-primary">
                {f.icon}
              </span>
              <Badge tone={f.tone}>{f.badge}</Badge>
            </div>
            <div className="font-semibold">{f.name}</div>
            <div className="mt-0.5 font-mono text-xs text-muted">{f.purpose}</div>
            <div className="mt-2 text-[13px] text-muted">파일 {f.count}개</div>
          </div>
        ))}
      </div>

      {/* File table */}
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        강의 영상 폴더
      </div>
      <div className="overflow-hidden rounded-card border bg-surface">
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
              <tr
                key={i}
                className="border-t hover:bg-surface-muted"
              >
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <FileText size={18} className="text-info" />
                    {file.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={file.tone}>{file.badge}</Badge>
                </td>
                <td className="px-4 py-3 text-muted">{file.size}</td>
                <td className="px-4 py-3 text-muted">{file.updated}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button className="rounded-control border border-[#A9BFD6] p-2 text-ink hover:bg-surface-muted">
                      <Download size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
