"use client";

import { useRef, useState } from "react";
import { Send, Sparkles, Play } from "lucide-react";
import { Card, CardTitle, Input } from "@/components/ui";
import { VideoPlayer, type VideoPlayerHandle } from "./video-player";

interface QaMessage {
  role: "user" | "ai";
  text: string;
  sources?: string[];
}

// "41:20" / "1:02:05" → seconds. null if not a timestamp.
function parseTimestamp(label: string): number | null {
  const m = label.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = m[3] ? Number(m[3]) : null;
  return c === null ? a * 60 + b : a * 3600 + b * 60 + c;
}

function parseSources(text: string): { body: string; sources?: string[] } {
  const idx = text.lastIndexOf("출처:");
  if (idx === -1) return { body: text };
  const body = text.slice(0, idx).trim();
  const sources = text
    .slice(idx + 3)
    .split(/[,·|\n]/)
    .map((s) => s.replace(/[[\]]/g, "").trim())
    .filter(Boolean);
  return { body, sources: sources.length ? sources : undefined };
}

export function SessionInteractive({ videoUrl, sessionId }: { videoUrl: string | null; sessionId: string }) {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [messages, setMessages] = useState<QaMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text: question }, { role: "ai", text: "" }]);
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, sessionId }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("no stream");
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const { body } = parseSources(acc);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "ai", text: body || acc };
          return next;
        });
      }
      const { body, sources } = parseSources(acc);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "ai", text: body, sources };
        return next;
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "ai", text: "답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요." };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
      {/* 영상 */}
      <div>
        {videoUrl ? (
          <VideoPlayer ref={playerRef} url={videoUrl} />
        ) : (
          <div className="grid aspect-video place-items-center rounded-[15px] bg-dark text-sm text-white/60">
            아직 강의 영상이 업로드되지 않았습니다.
          </div>
        )}
      </div>

      {/* AI 조교 (RAG) */}
      <Card className="flex flex-col p-0">
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-info-surface text-info">
            <Sparkles size={15} />
          </span>
          <CardTitle>AI 조교에게 질문</CardTitle>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ minHeight: 220, maxHeight: 360 }}>
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              이 강의 내용을 RAG로 학습한 AI 조교입니다. 무엇이든 물어보세요.
            </p>
          ) : (
            messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-sm text-white">
                  {m.text}
                </div>
              ) : (
                <div key={i} className="max-w-[92%]">
                  <div className="whitespace-pre-wrap rounded-2xl bg-canvas px-3.5 py-2.5 text-sm text-ink">
                    {m.text || <span className="text-faint">답변을 작성 중입니다…</span>}
                  </div>
                  {m.sources && m.sources.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {m.sources.map((s) => {
                        const sec = parseTimestamp(s);
                        return sec !== null ? (
                          <button
                            key={s}
                            onClick={() => playerRef.current?.seekTo(sec)}
                            className="inline-flex items-center gap-1 rounded-full border border-primary bg-info-surface px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary hover:text-white"
                          >
                            <Play size={10} /> {s}
                          </button>
                        ) : (
                          <span key={s} className="rounded-full border border-cardline bg-surface px-2 py-0.5 text-[11px] text-muted">
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ),
            )
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-hairline px-3 py-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask(input);
            }}
            placeholder="이 강의에 대해 물어보세요"
          />
          <button
            onClick={() => ask(input)}
            disabled={busy}
            aria-label="전송"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}
