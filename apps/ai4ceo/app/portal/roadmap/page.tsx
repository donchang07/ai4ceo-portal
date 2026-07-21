import { requireLmsAccess } from "@/lib/db/auth";
import { RoadmapView } from "./roadmap-view";

// Design Ref: SCR-08 — AX 로드맵 작성 + 발표 모드
export default async function RoadmapPage() {
  const user = await requireLmsAccess();
  return <RoadmapView userId={user.id} cohortId={user.cohortId} />;
}
