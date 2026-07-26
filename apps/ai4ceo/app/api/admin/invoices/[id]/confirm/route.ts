// Design Ref: PRD v3.2 C-6 / C-9 — 운영자 수동 입금확인(은행입금·스마트스토어 공통).
// match_ref(입금자명/스토어주문번호)를 함께 기록한다.
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { isAdmin } from "@/lib/core/access";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return Response.json({ error: "forbidden" }, { status: 403 });
  const { id } = await context.params;

  let matchRef: string | null = null;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("form")) {
    const form = await req.formData();
    matchRef = ((form.get("match_ref") as string | null) ?? "").trim() || null;
  }

  const sb = await getSupabaseServer();
  const { error } = await sb.rpc("confirm_invoice_paid", { p_invoice_id: id, p_match_ref: matchRef });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.redirect(new URL(`/admin/billing?confirmed=${encodeURIComponent(id)}`, req.url), 303);
}
