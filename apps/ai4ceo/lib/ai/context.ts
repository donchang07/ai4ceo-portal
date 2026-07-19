// Design Ref: PRD 6.7 / D-25 — Contextual AI Tutor context assembly.
// Injects the cohort's sessions / materials / assignments as source text so the
// tutor answers from up-to-date curriculum (auto-refreshed on content edits),
// plus RAG chunks retrieved from the CEO18기 강의자료 vector store.

import { getSessions, getAssignments } from "../db/queries";
import type { RagChunk } from "./retrieval";

export interface ContextSource {
  type: "session" | "assignment" | "material" | "lecture_file";
  id: string;
  title: string;
  text: string;
}

export async function buildTutorContext(): Promise<ContextSource[]> {
  const [sessions, assignments] = await Promise.all([getSessions(), getAssignments()]);
  const sources: ContextSource[] = [];

  for (const s of sessions) {
    sources.push({
      type: "session",
      id: s.id,
      title: `${s.week_no}주차 · ${s.title}`,
      text: `${s.week_no}주차 [${s.track ?? ""}] ${s.title}. ${s.description ?? ""} (일시: ${s.starts_at})`,
    });
  }
  for (const a of assignments) {
    sources.push({
      type: "assignment",
      id: a.id,
      title: `과제 · ${a.title}`,
      text: `과제: ${a.title}. ${a.description} 마감: ${a.due_at}`,
    });
  }
  return sources;
}

export function ragChunksToSources(chunks: RagChunk[]): ContextSource[] {
  return chunks.map((c) => ({
    type: "lecture_file" as const,
    id: `${c.file_path}#${c.chunk_index}`,
    title: `강의자료 · ${c.file_name}`,
    text: c.content,
  }));
}

export function buildSystemPrompt(sources: ContextSource[]): string {
  const ctx = sources.map((s, i) => `[출처 ${i + 1}: ${s.title}]\n${s.text}`).join("\n\n");
  return `당신은 AI4CEO 바이브코딩 스쿨 18기의 AI 조교입니다. CEO·임원 수강생을 돕습니다.
아래 커리큘럼·과제·강의자료 컨텍스트를 근거로 답하고, 존대말로 간결하게 안내하세요.
컨텍스트에 근거가 없는 일반 지식 질문이면, 일반 지식으로 답하되 컨텍스트에 없다는 사실을 밝히세요.

답변 형식을 반드시 지키세요:
1) 본문: 핵심을 번호 리스트로 정리
2) 마지막 줄에 근거가 된 출처를 "출처: [출처 N 제목]" 형식으로 표기
3) 확실하지 않으면 "정확한 내용은 강사 확인이 필요합니다"라고 불확실성을 밝히기

=== 커리큘럼·과제·강의자료 컨텍스트 ===
${ctx}
=== 컨텍스트 끝 ===`;
}
