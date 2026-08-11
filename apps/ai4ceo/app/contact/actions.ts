"use server";

import { getSupabaseServer } from "@/lib/db/supabase-server";
import { notify } from "@/lib/notify";
import { ADMIN_EMAIL } from "@/lib/core/constants";

// 공개 문의 폼 → inquiries 저장 + 관리자 이메일 알림.
// inquiries_insert RLS가 public insert를 허용하므로 anon 클라이언트로 충분하다.
export async function submitInquiry(form: {
  name: string;
  email: string;
  phone: string;
  message: string;
  source?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const name = form.name.trim();
  const message = form.message.trim();
  if (!name || !message) return { ok: false, error: "성함과 문의 내용을 입력해 주세요." };

  try {
    const sb = await getSupabaseServer();
    const { error } = await sb.from("inquiries").insert({
      name,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      message,
      source: form.source ?? null,
      status: "new",
    });
    if (error) return { ok: false, error: "문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  } catch {
    return { ok: false, error: "문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  await notify({
    channel: "email",
    templateCode: "INQUIRY",
    to: ADMIN_EMAIL,
    subject: `[AI4CEO] 새 문의 — ${name}`,
    body: [
      `이름: ${name}`,
      `이메일: ${form.email.trim() || "-"}`,
      `연락처: ${form.phone.trim() || "-"}`,
      `유입: ${form.source ?? "-"}`,
      "",
      message,
    ].join("\n"),
  }).catch(() => null);

  return { ok: true };
}
