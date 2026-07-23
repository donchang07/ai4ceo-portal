// Design Ref: PRD v3.2 C-8 — Toss 결제창 진입점.
// "화면 추후 추가": PAYMENT_TOSS_ENABLED=on 이 아니면 노출하지 않는다(notFound).
import { notFound } from "next/navigation";
import { requireBillingAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { isTossCheckoutEnabled, getTossClientKey } from "@/lib/billing/toss";
import { CheckoutView } from "./checkout-view";

export default async function CheckoutPage() {
  if (!isTossCheckoutEnabled()) notFound();

  const user = await requireBillingAccess();
  const sb = await getSupabaseServer();

  const { data: enrollment } = await sb
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let invoice: { id: string; amount: number; number: string | null } | null = null;
  if (enrollment) {
    const { data: inv } = await sb
      .from("invoices")
      .select("id, amount, number, status")
      .eq("enrollment_id", enrollment.id)
      .eq("status", "issued")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    invoice = inv ? { id: inv.id, amount: inv.amount, number: inv.number } : null;
  }

  return <CheckoutView invoice={invoice} clientKey={getTossClientKey()} />;
}
