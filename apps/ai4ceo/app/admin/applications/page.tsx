import { AdminShell } from "@/components/admin-shell";
import { Badge, SectionTitle } from "@/components/ui";
import { getApplications } from "@/lib/db/queries";
import { ApplicationsTable } from "./table";

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <AdminShell>
      <div className="flex items-center gap-3">
        <SectionTitle>선발 관리</SectionTitle>
        <Badge tone="info">18기</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">지원자를 검토하고 상태를 변경합니다. 추천 경로와 동기를 함께 확인하세요.</p>

      <div className="mt-6">
        <ApplicationsTable applications={applications} />
      </div>
    </AdminShell>
  );
}
