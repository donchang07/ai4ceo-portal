import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { getSupabaseServer } from "@/lib/db/supabase-server";

interface EscalatedLog {
  id: string;
  question: string | null;
  answer: string | null;
  created_at: string;
  profiles: { name: string | null; company: string | null } | null;
}

// Design Ref: §5.1 — US-05 에스컬레이션 검수 큐. admin 전용 (RLS is_admin + 페이지 가드 이중)
export default async function AdminAiPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role)) redirect("/portal/cohort");

  let logs: EscalatedLog[] = [];
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from("ai_question_logs")
      .select("id, question, answer, created_at, profiles(name, company)")
      .eq("status", "escalated")
      .order("created_at", { ascending: false })
      .limit(50);
    logs = (data as unknown as EscalatedLog[]) ?? [];
  } catch {
    logs = [];
  }

  return (
    <AdminShell>
      <div className="flex items-center gap-3">
        <SectionTitle>AI 조교 검수 큐</SectionTitle>
        <Badge tone="progress">에스컬레이션</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        AI 답변으로 해결되지 않아 수강생이 전달한 질문입니다. 다음 세션·코칭에서 우선 다뤄 주세요.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {logs.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">에스컬레이션된 질문이 없습니다.</p>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">
                  {log.profiles?.name ?? "알 수 없음"}
                  {log.profiles?.company ? <span className="font-normal text-muted"> · {log.profiles.company}</span> : null}
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone="progress">escalated</Badge>
                  <span className="text-xs text-muted">{new Date(log.created_at).toLocaleString("ko-KR")}</span>
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{log.question ?? "(질문 없음)"}</p>
              {log.answer ? (
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap rounded-control bg-surface-muted px-3 py-2 text-xs text-muted">
                  AI 답변: {log.answer}
                </p>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </AdminShell>
  );
}
