"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import type { Inquiry } from "@/lib/db/types";

// RLS(inquiries_admin, is_admin())가 실제 권한을 강제한다 — applications actions와 동일한 방식.
export async function updateInquiryStatus(
  id: string,
  status: Inquiry["status"],
): Promise<{ ok: boolean; message: string }> {
  try {
    const sb = await getSupabaseServer();
    const { error } = await sb.from("inquiries").update({ status }).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "상태 변경 실패" };
  }
  revalidatePath("/admin/inquiries");
  return { ok: true, message: "" };
}

export async function saveInquiryNote(id: string, note: string): Promise<{ ok: boolean; message: string }> {
  try {
    const sb = await getSupabaseServer();
    const { error } = await sb.from("inquiries").update({ admin_note: note.trim() || null }).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "메모 저장 실패" };
  }
  revalidatePath("/admin/inquiries");
  return { ok: true, message: "" };
}
