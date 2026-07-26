// Design Ref: PRD v3.2 C-11 / §6.11 — 결제 대사 리포트(관리자).
// DB 기준 미입금·금액 불일치(부분/초과)·고아 pending 을 집계한다.
// 라이브 Toss 조회/거래대사 API 연동은 라이브 키 발급 후 확장(현재 DB 대사만).
import { getCurrentUser } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { isAdmin } from "@/lib/core/access";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return Response.json({ error: "forbidden" }, { status: 403 });
  const sb = await getSupabaseServer();
  const { data, error } = await sb.rpc("reconcile_billing");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ rows: data ?? [] });
}
