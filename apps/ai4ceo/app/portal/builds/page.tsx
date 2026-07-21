import { requireLmsAccess } from "@/lib/db/auth";
import { BuildsView } from "./builds-view";

// Design Ref: PRD v3.0 SCR-05 — 결과물 등록·회사 적용 추적
export default async function BuildsPage() {
  const user = await requireLmsAccess();
  return <BuildsView userId={user.id} cohortId={user.cohortId} />;
}
