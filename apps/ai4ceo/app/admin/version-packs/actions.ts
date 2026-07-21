"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { getSupabaseServer } from "@/lib/db/supabase-server";

// Design Ref: prd-v3-cycle4.design.md §5 — H-13 Version Pack 관리 (조회+잠금 범위 한정)

export async function toggleLock(packId: string, currentlyLocked: boolean) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return { ok: false as const, message: "권한이 없습니다." };

  const sb = await getSupabaseServer();
  const { error } = await sb
    .from("cohort_version_packs")
    .update({ locked_at: currentlyLocked ? null : new Date().toISOString() })
    .eq("id", packId);
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/admin/version-packs");
  return { ok: true as const };
}
