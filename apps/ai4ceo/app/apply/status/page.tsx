import type { Metadata } from "next";
import { ApplyStatusView } from "./status-view";
import { getSupabaseServer } from "@/lib/db/supabase-server";

export const metadata: Metadata = { title: "지원 상태 조회 — AI4CEO" };

// Design Ref: §5.1 — 공개 화면(가드 없음). 조회는 security definer RPC로만 수행
export default async function ApplyStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; phone?: string }>;
}) {
  const params = await searchParams;
  const email = params.email?.trim() ?? "";
  const phone = params.phone?.trim() ?? "";
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validPhone = phone.replace(/\D/g, "").length >= 10;
  const attempted = Boolean(email || phone);
  const validationError =
    attempted && !validEmail
      ? "올바른 이메일을 입력해 주세요."
      : attempted && !validPhone
        ? "전화번호를 숫자 10자리 이상 입력해 주세요."
        : "";
  let rows = [];
  if (validEmail && validPhone) {
    const sb = await getSupabaseServer();
    const result = await sb.rpc("lookup_application_status", { p_email: email, p_phone: phone });
    rows = result.data ?? [];
  }
  return (
    <ApplyStatusView
      initialEmail={email}
      initialPhone={phone}
      initialRows={rows}
      submitted={validEmail && validPhone}
      initialValidationError={validationError}
    />
  );
}
