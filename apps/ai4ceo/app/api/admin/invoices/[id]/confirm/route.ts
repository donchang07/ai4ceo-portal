import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { isAdmin } from "@/lib/core/access";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return Response.json({ error: "forbidden" }, { status: 403 });
  const { id } = await context.params;
  const sb = await getSupabaseServer();
  const { error } = await sb.rpc("confirm_invoice_paid", { p_invoice_id: id });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.redirect(new URL(`/admin/billing?confirmed=${encodeURIComponent(id)}`, req.url), 303);
}
