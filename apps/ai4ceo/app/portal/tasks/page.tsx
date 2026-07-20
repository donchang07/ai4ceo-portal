import { requireLmsAccess } from "@/lib/db/auth";
import { TasksView } from "./tasks-view";

// Design Ref: §5.1 — US-07 위임 할 일. 재학생·assistant·admin만
export default async function TasksPage() {
  const user = await requireLmsAccess();
  return <TasksView userId={user.id} userEmail={user.email} />;
}
