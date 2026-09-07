import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Card, SectionTitle, type Tone } from "@/components/ui";
import { getChatFiles, getChatRoomSummaries, getVideoPolicies } from "@/lib/db/queries";

// Design Ref: PRD §6.4/§6.6 — 강의 영상은 read-only, 대화방 파일은 참여자 read/write
const FILE_PERMISSION: Record<string, { label: string; tone: Tone }> = {
  cohort_rw: { label: "참여자 읽기·쓰기", tone: "done" },
  cohort_readonly: { label: "참여자 읽기 전용", tone: "info" },
  private: { label: "비공개", tone: "neutral" },
};

const VIDEO_VISIBILITY: Record<string, { label: string; tone: Tone }> = {
  cohort_readonly: { label: "수강생 읽기 전용", tone: "info" },
  private: { label: "비공개", tone: "neutral" },
  public: { label: "전체 공개", tone: "danger" },
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminDrivePolicyPage() {
  const [rooms, files, videos] = await Promise.all([
    getChatRoomSummaries(),
    getChatFiles(),
    getVideoPolicies(),
  ]);

  const unlinkedRooms = rooms.filter((r) => !r.google_drive_folder_url);
  const openVideos = videos.filter((v) => v.visibility !== "cohort_readonly");

  return (
    <AdminShell>
      <div className="flex items-center gap-3">
        <SectionTitle>Drive 권한 정책</SectionTitle>
        {openVideos.length > 0 && <Badge tone="danger">검토 필요 {openVideos.length}건</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted">
        강의 영상은 수강생에게 읽기 전용으로만 열리고, 대화방 파일은 참여자가 함께 쓸 수 있어야 합니다.
        이 원칙에서 벗어난 항목을 여기서 찾아냅니다.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-muted">Drive 폴더 미연결 대화방</div>
          <div className="mt-1 text-2xl font-bold">{unlinkedRooms.length}개</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">공유 파일</div>
          <div className="mt-1 text-2xl font-bold">{files.length}개</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">읽기 전용이 아닌 영상</div>
          <div className="mt-1 text-2xl font-bold">{openVideos.length}건</div>
        </Card>
      </div>

      <h2 className="mt-8 text-base font-semibold">대화방 Drive 폴더</h2>
      <div className="mt-3 grid gap-2">
        {rooms.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{r.title ?? "제목 없는 대화방"}</span>
              {r.google_drive_folder_url ? (
                <Link
                  href={r.google_drive_folder_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  폴더 열기
                </Link>
              ) : (
                <Badge tone="wait">폴더 미연결</Badge>
              )}
            </div>
          </Card>
        ))}
        {rooms.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">개설된 대화방이 없습니다.</p>
        )}
      </div>

      <h2 className="mt-8 text-base font-semibold">강의 영상 공개 범위</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-medium">영상</th>
              <th className="py-2 pr-4 font-medium">공개 범위</th>
              <th className="py-2 font-medium">링크</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => {
              const p = VIDEO_VISIBILITY[v.visibility] ?? {
                label: v.visibility,
                tone: "danger" as Tone,
              };
              return (
                <tr key={v.id} className="border-b border-line/60">
                  <td className="py-2.5 pr-4">{v.title ?? "제목 없음"}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={p.tone}>{p.label}</Badge>
                  </td>
                  <td className="py-2.5">
                    {v.google_drive_url ? (
                      <Link
                        href={v.google_drive_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        열기
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {videos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">등록된 강의 영상이 없습니다.</p>
        )}
      </div>

      <h2 className="mt-8 text-base font-semibold">대화방 공유 파일 권한</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-medium">파일</th>
              <th className="py-2 pr-4 font-medium">형식</th>
              <th className="py-2 pr-4 font-medium">크기</th>
              <th className="py-2 font-medium">권한</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => {
              const p = FILE_PERMISSION[f.permission] ?? {
                label: f.permission,
                tone: "danger" as Tone,
              };
              return (
                <tr key={f.id} className="border-b border-line/60">
                  <td className="py-2.5 pr-4">{f.name ?? "이름 없음"}</td>
                  <td className="py-2.5 pr-4 text-xs text-muted">{f.mime_type ?? "—"}</td>
                  <td className="py-2.5 pr-4">{formatSize(f.size_bytes)}</td>
                  <td className="py-2.5">
                    <Badge tone={p.tone}>{p.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {files.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">공유된 파일이 없습니다.</p>
        )}
      </div>
    </AdminShell>
  );
}
