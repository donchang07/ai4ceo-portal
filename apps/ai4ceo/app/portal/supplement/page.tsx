import { requireLmsAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { SupplementView, type SupplementSlot } from "./supplement-view";

// Design Ref: prd-v3-m2-booking.design.md §4 — SCR /portal/supplement (D-13, P0)
export default async function SupplementPage() {
  const user = await requireLmsAccess();

  let slots: SupplementSlot[] = [];
  try {
    const sb = await getSupabaseServer();
    const { data: sessions } = await sb
      .from("sessions")
      .select("id, week_no, title, starts_at, ends_at, place, capacity, description")
      .eq("type", "offline_supplement")
      .eq("is_published", true)
      .order("starts_at", { ascending: true });

    const sessionList = sessions ?? [];
    if (sessionList.length > 0) {
      const ids = sessionList.map((s) => s.id);
      const { data: bookings } = await sb
        .from("session_bookings")
        .select("session_id, user_id, status")
        .in("session_id", ids)
        .eq("status", "booked");
      const countBySession = new Map<string, number>();
      const myBookedIds = new Set<string>();
      for (const b of bookings ?? []) {
        countBySession.set(b.session_id, (countBySession.get(b.session_id) ?? 0) + 1);
        if (b.user_id === user.id) myBookedIds.add(b.session_id);
      }
      slots = sessionList.map((s) => ({
        ...s,
        bookedCount: countBySession.get(s.id) ?? 0,
        myBooked: myBookedIds.has(s.id),
      }));
    }
  } catch {
    /* 스키마 미적용 환경 — 빈 목록으로 렌더 */
  }

  return <SupplementView slots={slots} />;
}
