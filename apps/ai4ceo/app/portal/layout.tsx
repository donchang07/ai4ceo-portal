import { getCurrentUser } from "@/lib/db/auth";
import { AdminProvider } from "@/lib/core/admin-context";

// Design Ref: PRD 1.7/2.2 — makes role=admin available to PortalShell (nav link to /admin)
// without every /portal/* page having to fetch it individually.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <AdminProvider isAdmin={user?.role === "admin"}>{children}</AdminProvider>;
}
