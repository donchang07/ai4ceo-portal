import { sendEmail } from "./email";
import { getSupabaseServer } from "../db/supabase-server";

// Design Ref: PRD 6.5 / 9 — notification engine.
// email = real SMTP send; alimtalk/sms = no-op (queued log only, Solapi stub).

export type Channel = "alimtalk" | "email" | "sms";

export interface NotifyInput {
  channel: Channel;
  templateCode: string; // T-01 ~ T-15
  to?: string; // phone or email
  userId?: string | null;
  subject?: string;
  body: string;
  payload?: Record<string, unknown>;
}

async function logNotification(input: NotifyInput, status: "queued" | "sent" | "failed") {
  try {
    const sb = await getSupabaseServer();
    await sb.from("notifications").insert({
      user_id: input.userId ?? null,
      phone: input.channel !== "email" ? input.to ?? null : null,
      channel: input.channel,
      template_code: input.templateCode,
      payload: input.payload ?? {},
      status,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
  } catch {
    /* schema may be unapplied — ignore */
  }
}

export async function notify(input: NotifyInput): Promise<{ status: "queued" | "sent" | "failed" }> {
  if (input.channel === "email" && input.to) {
    const ok = await sendEmail({ to: input.to, subject: input.subject ?? input.templateCode, text: input.body });
    const status = ok ? "sent" : "failed";
    await logNotification(input, status);
    return { status };
  }
  // alimtalk / sms: Solapi not wired — record queued + console log only (no-op)
  console.log(`[notify:${input.channel}] ${input.templateCode} -> ${input.to ?? "(user)"} : ${input.body}`);
  await logNotification(input, "queued");
  return { status: "queued" };
}
