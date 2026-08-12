import Anthropic from "@anthropic-ai/sdk";

// Design Ref: PRD 6.7 — AI 조교 호출.
//
// 주 모델은 AI_MODEL 로 정한다. 값이 gpt/o 계열이면 OpenAI, 아니면 Anthropic 으로 나간다.
// 제공자가 섞이면 Anthropic 서버측 fallback 기능을 쓸 수 없어서(OpenAI 실패를 Anthropic 서버가
// 대신 받아줄 수 없다) 폴백은 앱에서 직접 처리한다 — 주 모델 실패 시 AI_FALLBACK_MODEL 로 재호출.
//
// OpenAI 는 임베딩(lib/ai/retrieval.ts)과 같은 방식으로 REST 를 직접 호출한다. 새 패키지가 필요 없다.

export const AI_MODEL = process.env.AI_MODEL || "gpt-5.6-luna";
export const AI_FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || "claude-sonnet-5";

// 응답 길이 상한. 조교 답변은 근거를 길게 붙일 수 있어 넉넉히 둔다.
export const MAX_OUTPUT_TOKENS = 64_000;

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

function isOpenAiModel(model: string): boolean {
  return /^(gpt|o\d)/i.test(model);
}

export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

// ── OpenAI ────────────────────────────────────────────────────────────
async function openAiChat(opts: {
  model: string;
  system: string;
  messages: TutorMessage[];
  stream: boolean;
}): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY 미설정");

  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: opts.model,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      stream: opts.stream,
      messages: [
        { role: "system", content: opts.system },
        ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }
  return res;
}

// OpenAI SSE(data: {...}) 를 평문 토큰 스트림으로 바꾼다.
function openAiSseToText(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.getReader();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const text = json.choices?.[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          /* 부분 청크는 다음 루프에서 이어붙는다 */
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}

// ── Anthropic ─────────────────────────────────────────────────────────
function anthropicStream(client: Anthropic, model: string, system: string, messages: TutorMessage[]) {
  return client.beta.messages.stream({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    output_config: { effort: "medium" },
  } as Parameters<typeof client.beta.messages.stream>[0]);
}

function anthropicStreamToText(stream: ReturnType<typeof anthropicStream>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          const e = event as { type: string; delta?: { type?: string; text?: string } };
          if (e.type === "content_block_delta" && e.delta?.type === "text_delta" && e.delta.text) {
            controller.enqueue(encoder.encode(e.delta.text));
          }
        }
      } catch (err) {
        console.error("[tutor] anthropic stream error", err);
        controller.enqueue(encoder.encode("\n\n답변 생성 중 오류가 발생했습니다."));
      } finally {
        controller.close();
      }
    },
  });
}

function offlineNotice(): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("AI 조교를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요."));
      controller.close();
    },
  });
}

// ── 공개 API ──────────────────────────────────────────────────────────
export async function streamTutor(opts: { system: string; messages: TutorMessage[] }): Promise<ReadableStream<Uint8Array>> {
  if (isOpenAiModel(AI_MODEL)) {
    try {
      const res = await openAiChat({ model: AI_MODEL, system: opts.system, messages: opts.messages, stream: true });
      if (res.body) return openAiSseToText(res.body);
    } catch (e) {
      console.error("[tutor] primary model failed, falling back", e);
    }
  }

  const client = getAnthropic();
  if (!client) return offlineNotice();

  const model = isOpenAiModel(AI_MODEL) ? AI_FALLBACK_MODEL : AI_MODEL;
  try {
    return anthropicStreamToText(anthropicStream(client, model, opts.system, opts.messages));
  } catch (e) {
    console.error("[tutor] fallback model failed", e);
    return offlineNotice();
  }
}

// 답변을 저장해야 하는 경우(세션 Q&A)에 쓰는 비스트리밍 변형.
export async function answerTutorOnce(opts: { system: string; question: string }): Promise<string> {
  const messages: TutorMessage[] = [{ role: "user", content: opts.question }];

  if (isOpenAiModel(AI_MODEL)) {
    try {
      const res = await openAiChat({ model: AI_MODEL, system: opts.system, messages, stream: false });
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (e) {
      console.error("[tutor] primary model failed, falling back", e);
    }
  }

  const client = getAnthropic();
  if (!client) return "AI 조교를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.";

  const model = isOpenAiModel(AI_MODEL) ? AI_FALLBACK_MODEL : AI_MODEL;
  try {
    const res = await client.beta.messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: opts.system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      output_config: { effort: "medium" },
    } as Parameters<typeof client.beta.messages.create>[0]);
    const msg = res as { content?: Array<{ type: string; text?: string }> };
    return (
      (msg.content ?? [])
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim() || "답변을 생성하지 못했습니다."
    );
  } catch (e) {
    console.error("[tutor] fallback model failed", e);
    return "답변을 생성하지 못했습니다.";
  }
}
