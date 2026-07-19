import { CalendarDays } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card } from "@/components/ui";
import { getAssignments } from "@/lib/db/queries";
import { requireLmsAccess } from "@/lib/db/auth";

function fmtDue(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 마감`;
}

export default async function AssignmentsPage() {
  await requireLmsAccess();
  const assignments = await getAssignments();
  return (
    <PortalShell title="과제">
      <h1 className="text-xl font-bold text-ink">과제</h1>
      <p className="mb-5 text-sm text-muted">제출 현황과 마감을 한 화면에서 관리합니다.</p>
      <div className="flex flex-col gap-3">
        {assignments.map((a) => (
          <Card key={a.id} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <Badge tone="wait">미제출</Badge>
              </div>
              <div className="text-base font-semibold text-ink">{a.title}</div>
              <p className="mt-1 text-[13px] text-muted">{a.description}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted">
                <CalendarDays size={15} /> {fmtDue(a.due_at)}
              </div>
            </div>
            <Button variant="secondary">과제 제출</Button>
          </Card>
        ))}
      </div>
    </PortalShell>
  );
}
