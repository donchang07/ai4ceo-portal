import Anthropic from "@anthropic-ai/sdk";

// Design Ref: PRD 6.7 — Claude streaming tutor call (Claude Fable 5).
// Fable 5 API notes: thinking is always on (omit the param), no temperature/top_p,
// and safety refusals are possible — we opt into server-side fallback to Opus 4.8
// so a declined request is transparently re-served instead of failing.
export const AI_MODEL = process.env.AI_MODEL || "claude-fable-5";

export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamTutor(opts: {
  system: string;
  messages: TutorMessage[];
}): Promise<ReadableStream<Uint8Array>> {
  const client = getAnthropic();
  const encoder = new TextEncoder();

  if (!client) {
    // No API key — return a graceful fallback stream
    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            "AI 조교 API 키가 설정되지 않아 데모 응답을 표시합니다.\n\n1) 질문 내용은 커리큘럼·자료·영상을 근거로 답변됩니다.\n2) 실제 응답은 ANTHROPIC_API_KEY 설정 후 활성화됩니다.\n\n출처: [18기 커리큘럼]\n정확한 내용은 강사 확인이 필요합니다.",
          ),
        );
        controller.close();
      },
    });
  }

  const stream = client.beta.messages.stream({
    model: AI_MODEL,
    max_tokens: 4096,
    system: opts.system,
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-06-01"],
    fallbacks: [{ model: "claude-opus-4-8" }],
  } as Parameters<typeof client.beta.messages.stream>[0]);

  return new ReadableStream({
    async start(controller) {
      try {
        stream.on("text", (text) => controller.enqueue(encoder.encode(text)));
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode("\n\n죄송합니다. 이 질문에는 답변드릴 수 없습니다. 다른 질문을 해주세요."),
          );
        }
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode(`\n\n[오류] 답변 생성 중 문제가 발생했습니다: ${String(e)}`));
        controller.close();
      }
    },
  });
}
