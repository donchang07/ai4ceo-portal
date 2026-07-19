import { Lock } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Button, SectionTitle } from "@/components/ui";
import { getSessions } from "@/lib/db/queries";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import type { Material, VideoRec } from "@/lib/db/types";
import { CurriculumEditor } from "./editor";
import { insertSession } from "./actions";

export default async function CurriculumPage() {
  const sessions = await getSessions();
  const sessionIds = sessions.map((s) => s.id);

  const supabase = await getSupabaseServer();
  const [{ data: videos }, { data: materials }] = await Promise.all([
    supabase.from("videos").select("*").in("session_id", sessionIds),
    supabase.from("materials").select("*").in("session_id", sessionIds),
  ]);

  const videoBySession: Record<string, VideoRec> = {};
  for (const v of (videos as VideoRec[]) ?? []) videoBySession[v.session_id] = v;
  const materialsBySession: Record<string, Material[]> = {};
  for (const m of (materials as Material[]) ?? []) {
    (materialsBySession[m.session_id] ??= []).push(m);
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SectionTitle>커리큘럼 편집</SectionTitle>
          <Badge tone="neutral">
            <Lock size={12} /> Version Pack v18 · 잠금됨
          </Badge>
        </div>
        <form action={insertSession}>
          <Button type="submit" variant="primary">+ 세션 삽입</Button>
        </form>
      </div>
      <p className="mt-1 text-sm text-muted">세션을 선택해 본문을 편집합니다. 저장 시 즉시 반영되고, 목록의 점 6개를 잡고 드래그하면 순서를 바꿀 수 있습니다.</p>

      <div className="mt-6">
        <CurriculumEditor
          key={sessions.map((s) => s.id).join(",")}
          sessions={sessions}
          videoBySession={videoBySession}
          materialsBySession={materialsBySession}
        />
      </div>
    </AdminShell>
  );
}
