import { requireLmsAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { CoachingView, type CoachingSlot } from "./coaching-view";

// Design Ref: prd-v3-m2-booking.design.md §3 — SCR /portal/coaching (D-12, P0)
export default async function CoachingPage() {
  const user = await requireLmsAccess();

  let slots: CoachingSlot[] = [];
  try {
    const sb = await getSupabaseServer();
    const { data: sessions } = await sb
      .from("sessions")
      .select("id, starts_at, ends_at, place, zoom_url, capacity, description")
      .eq("type", "coaching")
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
      let myBookedIds = new Set<string>();
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

  return <CoachingView slots={slots} />;
}
