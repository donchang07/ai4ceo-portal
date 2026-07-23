import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabase-server";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; phone?: string };
  if (!body.email || !body.phone) return Response.json({ error: "invalid input" }, { status: 400 });
  const sb = await getSupabaseServer();
  const { data, error } = await sb.rpc("lookup_application_status", {
    p_email: body.email,
    p_phone: body.phone,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ rows: data ?? [] });
}
