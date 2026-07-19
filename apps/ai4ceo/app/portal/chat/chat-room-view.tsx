"use client";

import { useState } from "react";
import { Pin, Plus, Send, FileText, Sparkles } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, RoleBadge, Input } from "@/components/ui";
import { MOCK_CHAT } from "@/lib/db/mock";
import type { ChatMessage } from "@/lib/db/types";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ChatRoomView() {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [input, setInput] = useState("");

  const pinned = messages.find((m) => m.message_type === "notice" && m.pinned);
  const stream = messages.filter((m) => m.message_type !== "notice");

  function send() {
    const body = input.trim();
    if (!body) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: "나",
        role: "student",
        body,
        message_type: "text",
        mine: true,
        readCount: 0,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  return (
    <PortalShell title="18기 대화방">
      <div className="flex h-[calc(100vh-9rem)] flex-col md:h-[calc(100vh-7rem)]">
        {/* Header */}
        <div className="pb-3">
          <h1 className="text-lg font-bold text-ink">18기 대화방</h1>
          <p className="text-xs text-muted">멤버 24명</p>
        </div>

        {/* Pinned notice */}
        {pinned ? (
          <div className="mb-3 flex items-start gap-2 rounded-control bg-info-surface px-3.5 py-2.5 text-[13px] text-info">
            <Pin size={15} className="mt-0.5 shrink-0 text-primary" />
            <span>{pinned.body}</span>
          </div>
        ) : null}

        {/* Message stream */}
        <div className="flex-1 space-y-4 overflow-y-auto rounded-[15px] border border-hairline bg-surface p-4">
          {stream.map((m) => (
            <Message key={m.id} m={m} />
          ))}
        </div>

        {/* Composer */}
        <div className="mt-3 flex items-center gap-2">
          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cardline text-muted hover:bg-surface-muted"
            aria-label="첨부"
          >
            <Plus size={18} />
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="메시지를 입력하세요"
          />
          <button
            onClick={send}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white"
            aria-label="보내기"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </PortalShell>
  );
}

function Message({ m }: { m: ChatMessage }) {
  // My message — right aligned
  if (m.mine) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm text-white">{m.body}</div>
        <span className="mt-1 text-[11px] text-faint">
          {m.readCount ? `읽음 ${m.readCount}` : ""} · {timeLabel(m.created_at)}
        </span>
      </div>
    );
  }

  // AI answer
  if (m.message_type === "ai_answer") {
    return (
      <div className="flex gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-info-surface text-info">
          <Sparkles size={16} />
        </span>
        <div className="max-w-[80%]">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted">
            <RoleBadge>AI</RoleBadge>
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-info-surface px-3.5 py-2.5 text-sm text-ink">{m.body}</div>
          {m.sources && m.sources.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {m.sources.map((s) => (
                <span
                  key={s.label}
                  className="rounded-full border border-cardline bg-surface px-2 py-0.5 text-[11px] text-muted"
                >
                  {s.label}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-1 text-[11px] text-faint">강사 검수 대기</p>
        </div>
      </div>
    );
  }

  // File message
  if (m.message_type === "file" && m.fileMeta) {
    return (
      <div className="flex gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-primary">
          {m.author.slice(0, 1)}
        </span>
        <div className="max-w-[80%]">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-ink">{m.author}</span>
            {m.role === "instructor" ? <RoleBadge>강사</RoleBadge> : null}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface px-3.5 py-3">
            <FileText size={22} className="shrink-0 text-info" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">{m.fileMeta.name}</div>
              <div className="mt-0.5 text-xs text-muted">
                {m.fileMeta.size} · {m.fileMeta.permission}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Instructor / default text
  return (
    <div className="flex gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-primary">
        {m.author.slice(0, 1)}
      </span>
      <div className="max-w-[80%]">
        <div className="mb-1 flex items-center gap-2 text-xs text-muted">
          <span className="font-semibold text-ink">{m.author}</span>
          {m.role === "instructor" ? <RoleBadge>강사</RoleBadge> : null}
          <span>{timeLabel(m.created_at)}</span>
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink">
          {m.body}
        </div>
      </div>
    </div>
  );
}
