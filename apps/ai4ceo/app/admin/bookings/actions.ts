"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { COHORT_18 } from "@/lib/core/constants";

// Design Ref: prd-v3-cycle4.design.md §4 — H-7 예약 관리(admin). 기존 admin/curriculum의
// insertSession(항상 type='special')과 분리된 전용 액션.

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) throw new Error("권한이 없습니다.");
  return user;
}

export async function createSlot(input: {
  slotType: "coaching" | "offline_supplement";
  startsAt: string;
  endsAt: string;
  place: string;
  zoomUrl: string;
  capacity: string;
  description: string;
}) {
  try {
    await assertAdmin();
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
  if (!input.startsAt || !input.endsAt) {
    return { ok: false as const, message: "시작·종료 시각을 입력해 주세요." };
  }

  const sb = await getSupabaseServer();
  const { error } = await sb.from("sessions").insert({
    cohort_id: COHORT_18.id,
    week_no: 0,
    title: input.slotType === "coaching" ? "1:1 코칭" : "오프라인 보충수업",
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    type: input.slotType,
    place: input.place.trim() || null,
    zoom_url: input.zoomUrl.trim() || null,
    capacity: input.capacity ? Number(input.capacity) : null,
    description: input.description.trim() || null,
    is_published: true,
  });
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/admin/bookings");
  revalidatePath("/portal/coaching");
  revalidatePath("/portal/supplement");
  return { ok: true as const };
}

export async function setAttended(bookingId: string, attended: boolean | null) {
  try {
    await assertAdmin();
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }

  const sb = await getSupabaseServer();
  const { error } = await sb.from("session_bookings").update({ attended }).eq("id", bookingId);
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/admin/bookings");
  return { ok: true as const };
}
