import { requireLmsAccess } from "@/lib/db/auth";
import { AiTutorView } from "./ai-tutor-view";

export default async function AiTutorPage() {
  await requireLmsAccess();
  return <AiTutorView />;
}
