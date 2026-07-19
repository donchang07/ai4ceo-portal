import { Lock } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Button, SectionTitle } from "@/components/ui";
import { getSessions } from "@/lib/db/queries";
import { CurriculumEditor } from "./editor";
import { insertSession } from "./actions";

export default async function CurriculumPage() {
  const sessions = await getSessions();

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
      <p className="mt-1 text-sm text-muted">세션을 선택해 본문을 편집합니다. 저장 시 즉시 반영되고 변경 이력이 자동 기록됩니다.</p>

      <div className="mt-6">
        <CurriculumEditor sessions={sessions} />
      </div>
    </AdminShell>
  );
}
