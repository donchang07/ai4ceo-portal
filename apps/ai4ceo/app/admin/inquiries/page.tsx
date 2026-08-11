import { AdminShell } from "@/components/admin-shell";
import { Badge, SectionTitle } from "@/components/ui";
import { getInquiries } from "@/lib/db/queries";
import { InquiriesTable } from "./table";

export default async function InquiriesPage() {
  const inquiries = await getInquiries();
  const pending = inquiries.filter((i) => i.status === "new").length;

  return (
    <AdminShell>
      <div className="flex items-center gap-3">
        <SectionTitle>문의 관리</SectionTitle>
        {pending > 0 && <Badge tone="progress">신규 {pending}건</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted">
        공개 페이지(/contact)로 접수된 문의를 확인하고 처리 상태와 메모를 관리합니다.
      </p>

      <div className="mt-6">
        <InquiriesTable inquiries={inquiries} />
      </div>
    </AdminShell>
  );
}
