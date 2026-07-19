import { requireBillingAccess } from "@/lib/db/auth";
import { BillingView } from "./billing-view";

export default async function BillingPage() {
  await requireBillingAccess();
  return <BillingView />;
}
