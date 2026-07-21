import { requireBillingAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { BillingView } from "./billing-view";

// Design Ref: prd-v30-remaining.design.md §4 F2 — SCR-03 결제 실무 위임 (US-04)
export default async function BillingPage() {
  const user = await requireBillingAccess();

  let enrollmentId: string | null = null;
  let delegateEmail: string | null = null;
  let invoice: { number: string | null; amount: number | null; status: string | null } | null = null;

  try {
    const sb = await getSupabaseServer();
    const { data: enrollment } = await sb
      .from("enrollments")
      .select("id, billing_delegate_email")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (enrollment) {
      enrollmentId = enrollment.id as string;
      delegateEmail = (enrollment.billing_delegate_email as string | null) ?? null;
      const { data: inv } = await sb
        .from("invoices")
        .select("number, amount, status")
        .eq("enrollment_id", enrollment.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      invoice = (inv as typeof invoice) ?? null;
    }
  } catch {
    /* 스키마 미적용 환경 — 뷰는 fallback 상수로 렌더 */
  }

  return (
    <BillingView
      enrollmentId={enrollmentId}
      initialDelegateEmail={delegateEmail}
      invoice={invoice}
    />
  );
}
