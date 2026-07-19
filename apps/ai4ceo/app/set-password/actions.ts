"use server";

import { getSupabaseServer } from "@/lib/db/supabase-server";

// Design Ref: 매직링크 최초 로그인 후 비밀번호 설정 완료 표시
export async function markPasswordSet() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "로그인이 필요합니다." };

  const { error } = await supabase.from("profiles").update({ has_password: true }).eq("id", user.id);
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const };
}
