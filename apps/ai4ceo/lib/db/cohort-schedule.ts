import { getSupabaseServer } from "./supabase-server";
import { COHORT_18 } from "../core/constants";

// 개강일·회차 수는 sessions 가 유일한 기준이다.
// 예전에는 constants.ts 에 문자열로 박아뒀다가 DB 와 어긋나 첫페이지에 서로 다른 날짜가
// 동시에 표시된 적이 있어, 상수를 없애고 여기서 매번 조회한다.

export interface CohortSchedule {
  /** 예: "2026년 9월 9일 18:00~21:00 · 총 10회" */
  label: string;
  startsAt: string;
  sessionCount: number;
}

function formatLabel(startsAt: Date, endsAt: Date | null, count: number): string {
  const opts = { timeZone: "Asia/Seoul" } as const;
  const date = new Intl.DateTimeFormat("ko-KR", {
    ...opts,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(startsAt);
  const time = (d: Date) =>
    new Intl.DateTimeFormat("ko-KR", { ...opts, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

  const range = endsAt ? `${time(startsAt)}~${time(endsAt)}` : time(startsAt);
  return `${date} ${range} · 총 ${count}회`;
}

export async function getCohortSchedule(): Promise<CohortSchedule | null> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("sessions")
      .select("starts_at, ends_at")
      .eq("cohort_id", COHORT_18.id)
      .eq("type", "regular_zoom")
      .order("starts_at", { ascending: true });

    const rows = (data as { starts_at: string; ends_at: string | null }[] | null) ?? [];
    if (rows.length === 0) return null;

    const first = rows[0];
    return {
      label: formatLabel(new Date(first.starts_at), first.ends_at ? new Date(first.ends_at) : null, rows.length),
      startsAt: first.starts_at,
      sessionCount: rows.length,
    };
  } catch {
    return null;
  }
}
