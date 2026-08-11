"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";

export interface ProfileForm {
  name: string;
  company: string;
  title: string;
  phone: string;
  marketing_opt_in: boolean;
  directory_opt_in: boolean;
}

const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;

export async function saveProfile(form: ProfileForm): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const name = form.name.trim();
  if (!name) return { ok: false, error: "성함을 입력해 주세요." };

  const phone = form.phone.trim();
  if (phone && !PHONE_RE.test(phone)) {
    return { ok: false, error: "휴대폰 번호 형식이 올바르지 않습니다. 예) 010-1234-5678" };
  }

  try {
    // RLS(profiles_self_upd)가 본인 행만 수정하도록 강제한다.
    const sb = await getSupabaseServer();
    const { error } = await sb
      .from("profiles")
      .update({
        name,
        company: form.company.trim() || null,
        title: form.title.trim() || null,
        phone: phone || null,
        marketing_opt_in: form.marketing_opt_in,
        directory_opt_in: form.directory_opt_in,
      })
      .eq("id", user.id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "저장에 실패했습니다." };
  }

  revalidatePath("/portal/profile");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const sb = await getSupabaseServer();
  await sb.auth.signOut();
  redirect("/");
}
