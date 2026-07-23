import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { BookingsManager, type SlotRow } from "./bookings-manager";

// Design Ref: prd-v3-cycle4.design.md §4 — H-7 예약 관리 (SCR /admin/bookings)
export default async function AdminBookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role)) redirect("/portal/cohort");

  let slots: SlotRow[] = [];
  try {
    const sb = await getSupabaseServer();
    const { data: sessions } = await sb
      .from("sessions")
      .select("id, title, starts_at, ends_at, place, zoom_url, capacity, description, type")
      .in("type", ["coaching", "offline_supplement"])
      .order("starts_at", { ascending: false });
    const sessionList = sessions ?? [];

    if (sessionList.length > 0) {
      const ids = sessionList.map((s) => s.id);
      const { data: bookings } = await sb
        .from("session_bookings")
        .select("id, session_id, status, attended, profiles(name)")
        .in("session_id", ids)
        .order("created_at", { ascending: true });
      const bySlot = new Map<string, SlotRow["bookings"]>();
      for (const b of (bookings as unknown as {
        id: string;
        session_id: string;
        status: string;
        attended: boolean | null;
        profiles: { name: string | null } | null;
      }[]) ?? []) {
        const arr = bySlot.get(b.session_id) ?? [];
        arr.push({ id: b.id, name: b.profiles?.name ?? "이름 없음", status: b.status, attended: b.attended });
        bySlot.set(b.session_id, arr);
      }
      slots = sessionList.map((s) => ({ ...s, bookings: bySlot.get(s.id) ?? [] }));
    }
  } catch {
    /* 스키마 미적용 환경 — 빈 목록으로 렌더 */
  }

  return (
    <AdminShell>
      <SectionTitle>코칭·보충수업 예약 관리</SectionTitle>
      <p className="mt-1 text-sm text-muted">슬롯을 만들고, 신청자와 참석 여부를 관리합니다.</p>
      <div className="mt-6">
        <BookingsManager slots={slots} />
      </div>
    </AdminShell>
  );
}
