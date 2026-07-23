import { requireAlumniAccess } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { ArchiveView } from "./archive-view";

// Design Ref: SCR-09 — 동문 아카이브. 멤버십 만료 후에도 목록은 열람 가능해야 하므로
// requireArchiveAccess가 아닌 requireAlumniAccess(알럼나이/admin 게이트)를 사용한다.
export default async function ArchivePage() {
  const user = await requireAlumniAccess();
  return (
    <ArchiveView
      hasActiveMembership={user.hasActiveMembership}
      canReadArchive={isAdmin(user.role) || user.hasActiveMembership}
    />
  );
}
