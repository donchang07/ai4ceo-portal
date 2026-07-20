"use client";

import { useCallback, useEffect, useState } from "react";
import { ListTodo, Plus } from "lucide-react";
import { z } from "zod";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle, Input, SectionTitle, Textarea } from "@/components/ui";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";

interface DelegatedTask {
  id: string;
  ceo_user_id: string;
  assistant_email: string;
  title: string;
  note: string | null;
  source_type: "assignment" | "material" | "schedule" | "other";
  status: "pending" | "in_progress" | "done";
  created_at: string;
}

const createSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요."),
  assistantEmail: z.string().trim().email("assistant 이메일을 확인해 주세요."),
  sourceType: z.enum(["assignment", "material", "schedule", "other"]),
  note: z.string().trim(),
});

const SOURCE_LABEL: Record<DelegatedTask["source_type"], string> = {
  assignment: "과제",
  material: "자료",
  schedule: "일정",
  other: "기타",
};

const STATUS_META: Record<DelegatedTask["status"], { label: string; tone: "neutral" | "progress" | "done" }> = {
  pending: { label: "대기", tone: "neutral" },
  in_progress: { label: "진행 중", tone: "progress" },
  done: { label: "완료", tone: "done" },
};

const NEXT_STATUS: Record<DelegatedTask["status"], DelegatedTask["status"]> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

export function TasksView({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [tasks, setTasks] = useState<DelegatedTask[]>([]);
  const [title, setTitle] = useState("");
  const [assistantEmail, setAssistantEmail] = useState("");
  const [sourceType, setSourceType] = useState<DelegatedTask["source_type"]>("other");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const sb = getSupabaseBrowser();
      const { data, error: selError } = await sb
        .from("delegated_tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (selError) throw selError;
      setTasks((data as DelegatedTask[]) ?? []);
    } catch {
      // 스키마 미적용 대비 — 기존 apply 폼 관례
      setTasks([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    const parsed = createSchema.safeParse({ title, assistantEmail, sourceType, note });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const sb = getSupabaseBrowser();
      const { error: insError } = await sb.from("delegated_tasks").insert({
        ceo_user_id: userId,
        assistant_email: parsed.data.assistantEmail,
        title: parsed.data.title,
        note: parsed.data.note || null,
        source_type: parsed.data.sourceType,
      });
      if (insError) throw insError;
      setTitle("");
      setAssistantEmail("");
      setNote("");
      setSourceType("other");
      await load();
    } catch {
      setError("위임에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function cycleStatus(task: DelegatedTask) {
    const next = NEXT_STATUS[task.status];
    try {
      const sb = getSupabaseBrowser();
      const { error: updError } = await sb
        .from("delegated_tasks")
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", task.id);
      if (updError) throw updError;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    } catch {
      setError("상태 변경에 실패했습니다.");
    }
  }

  const lowerEmail = userEmail.toLowerCase();

  return (
    <PortalShell title="위임 할 일">
      <div className="mx-auto max-w-[760px]">
        <div className="flex items-center gap-2">
          <ListTodo size={22} className="text-primary" />
          <SectionTitle>위임 할 일</SectionTitle>
        </div>
        <p className="mt-1 text-sm text-muted">
          자료 정리·과제 초안·일정 확인을 동반 임직원(assistant)에게 위임하고 진행 상태를 함께 봅니다.
        </p>

        <Card className="mt-5">
          <CardTitle>새 위임</CardTitle>
          <div className="mt-3 flex flex-col gap-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="할 일 제목 (예: 3주차 과제 자료 정리)" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                value={assistantEmail}
                onChange={(e) => setAssistantEmail(e.target.value)}
                placeholder="assistant 이메일"
              />
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as DelegatedTask["source_type"])}
                className="min-h-10 rounded-control border border-cardline bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                aria-label="유형"
              >
                <option value="assignment">과제</option>
                <option value="material">자료</option>
                <option value="schedule">일정</option>
                <option value="other">기타</option>
              </select>
            </div>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="메모 (선택)" />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button variant="primary" onClick={create} disabled={busy}>
              <Plus size={16} /> 위임하기
            </Button>
          </div>
        </Card>

        <div className="mt-6 flex flex-col gap-3">
          {loaded && tasks.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">아직 위임한 할 일이 없습니다. 위에서 첫 번째 할 일을 위임해 보세요.</p>
            </Card>
          ) : null}
          {tasks.map((task) => {
            const meta = STATUS_META[task.status];
            const mine = task.ceo_user_id === userId;
            const received = task.assistant_email.toLowerCase() === lowerEmail;
            return (
              <Card key={task.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge tone={mine ? "info" : "progress"}>{mine ? "위임함" : received ? "받음" : "공유"}</Badge>
                    <CardTitle className="truncate">{task.title}</CardTitle>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="rounded-full border border-cardline px-2 py-0.5">{SOURCE_LABEL[task.source_type]}</span>
                  <span>{mine ? `→ ${task.assistant_email}` : `← 위임받은 항목`}</span>
                  <span>{new Date(task.created_at).toLocaleDateString("ko-KR")}</span>
                </div>
                {task.note ? <p className="mt-2 text-sm text-ink">{task.note}</p> : null}
                <div className="mt-3">
                  <Button variant="outline" onClick={() => cycleStatus(task)}>
                    {task.status === "done" ? "다시 열기" : task.status === "pending" ? "진행 시작" : "완료 처리"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PortalShell>
  );
}
