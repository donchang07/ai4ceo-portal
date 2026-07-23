import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isTossCheckoutEnabled } from "@/lib/billing/toss";
import { requireBillingAccess } from "@/lib/db/auth";
import { CheckoutSuccess } from "./checkout-success";

export default async function CheckoutSuccessPage() {
  if (!isTossCheckoutEnabled()) notFound();
  await requireBillingAccess();
  return (
    <Suspense fallback={null}>
      <CheckoutSuccess />
    </Suspense>
  );
}
