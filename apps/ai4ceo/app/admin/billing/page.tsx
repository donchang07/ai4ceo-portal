import { AdminShell } from "@/components/admin-shell";
import { Badge, SectionTitle } from "@/components/ui";
import { getInvoices } from "@/lib/db/queries";
import { BillingPanel } from "./panel";

export default async function BillingPage() {
  const invoices = await getInvoices();

  return (
    <AdminShell>
      <div className="flex items-center gap-3">
        <SectionTitle>결제 · 세금계산서 관리</SectionTitle>
        <Badge tone="info">18기</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">인보이스 발행, 입금 확인, 세금계산서 발행을 관리합니다.</p>

      <div className="mt-6">
        <BillingPanel invoices={invoices} />
      </div>
    </AdminShell>
  );
}
