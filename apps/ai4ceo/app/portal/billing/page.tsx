import { requireBillingAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { BillingView, type Invoice } from "./billing-view";

export default async function BillingPage() {
  const user = await requireBillingAccess();
  const sb = await getSupabaseServer();

  const { data: enrollment } = await sb
    .from("enrollments")
    .select("id, billing_delegate_email")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let invoice: Invoice | null = null;
  let taxStatus: string | null = null;

  if (enrollment) {
    const { data: inv } = await sb
      .from("invoices")
      .select("id, number, amount, status, biz_name, biz_reg_no")
      .eq("enrollment_id", enrollment.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    invoice = inv ?? null;

    if (invoice) {
      const { data: tax } = await sb
        .from("tax_invoices")
        .select("id, status")
        .eq("invoice_id", invoice.id)
        .order("issued_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      taxStatus = tax?.status ?? null;
    }
  }

  return (
    <BillingView
      enrollmentId={enrollment?.id ?? null}
      delegateEmail={enrollment?.billing_delegate_email ?? null}
      invoice={invoice}
      taxStatus={taxStatus}
    />
  );
}
