"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import type { Application } from "@/lib/db/types";

// Design Ref: PRD B-5/B-6 — 선발 관리 상태 변경. RLS(applications_admin, is_admin())
// enforces that only an authenticated admin session can actually update a row.
export async function updateApplicationStatus(id: string, status: Application["status"]) {
  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("applications").update({ status }).eq("id", id);
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/applications");
  revalidatePath("/admin");
  return { ok: true as const };
}
