import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isTossCheckoutEnabled } from "@/lib/billing/toss";
import { requireBillingAccess } from "@/lib/db/auth";
import { CheckoutFail } from "./checkout-fail";

export default async function CheckoutFailPage() {
  if (!isTossCheckoutEnabled()) notFound();
  await requireBillingAccess();
  return (
    <Suspense fallback={null}>
      <CheckoutFail />
    </Suspense>
  );
}
