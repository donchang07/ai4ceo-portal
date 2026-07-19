"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card, CardTitle, Input } from "@/components/ui";
import { cn } from "@/lib/core/cn";

interface QaMessage {
  role: "user" | "ai";
  text: string;
  sources?: string[];
}

const SEED: QaMessage[] = [
  { role: "user", text: "CLAUDE.md에는 무엇을 적어야 하나요?" },
  {
    role: "ai",
    text: "CLAUDE.md에는 1) 코드 스타일 2) 금지사항 3) 워크플로 규칙을 적으면 됩니다. 회사 규칙도 함께 넣을 수 있습니다.",
    sources: ["영상 41:20", "자료 p.12"],
  },
];

export function QaPanel() {
  const [messages, setMessages] = useState<QaMessage[]>(SEED);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text: q }, { role: "ai", text: "", sources: ["영상", "자료"] }]);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("no stream");
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], text: acc };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], text: "답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요." };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col p-0">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-info-surface text-info">
          <Sparkles size={15} />
        </span>
        <CardTitle>영상 Q&amp;A</CardTitle>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-sm text-white">
              {m.text}
            </div>
          ) : (
            <div key={i} className="max-w-[90%]">
              <div className="rounded-2xl bg-canvas px-3.5 py-2.5 text-sm text-ink">
                {m.text || <span className="text-faint">답변을 작성 중입니다…</span>}
              </div>
              {m.sources && m.sources.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.sources.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-cardline bg-surface px-2 py-0.5 text-[11px] text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-1 text-[11px] text-faint">정확한 내용은 강사 확인이 필요할 수 있습니다.</p>
            </div>
          ),
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-hairline px-3 py-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="이 영상에 대해 물어보세요"
        />
        <button
          onClick={send}
          disabled={busy}
          aria-label="전송"
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white transition-colors disabled:opacity-50",
          )}
        >
          <Send size={16} />
        </button>
      </div>
    </Card>
  );
}
