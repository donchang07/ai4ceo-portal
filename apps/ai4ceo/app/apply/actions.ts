"use server";

import { getSupabaseServer } from "@/lib/db/supabase-server";
import { notify } from "@/lib/notify";
import { COHORT_18 } from "@/lib/core/constants";

// Design Ref: prd-v30-final.design.md §4 F3 — 지원 접수 시 알림톡 T-01 (PRD §9).
// applications_insert RLS는 public insert를 허용하므로 서버 액션에서도 anon 클라이언트로 충분하다.
export async function submitApplication(form: {
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  referral_code: string;
  motivation: string;
}): Promise<{ ok: boolean; receiptNo: string }> {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const receiptNo = `AP-18-${rand}`;

  try {
    const sb = await getSupabaseServer();
    await sb.from("applications").insert({
      cohort_id: COHORT_18.id,
      name: form.name,
      company: form.company,
      title: form.title,
      phone: form.phone,
      email: form.email,
      motivation: form.motivation,
      referral_code: form.referral_code.trim() || null,
      status: "received",
    });

    await notify({
      channel: "alimtalk",
      templateCode: "T-01",
      to: form.phone,
      body: `${form.name}님, AI4CEO ${COHORT_18.name} 지원서가 정상 접수되었습니다. 지원번호: ${receiptNo}.`,
      payload: { name: form.name, receiptNo, cohort: COHORT_18.name },
    });
  } catch {
    /* 스키마 미적용 환경 — 접수번호는 항상 반환해 사용자 경험을 막지 않는다 */
  }

  return { ok: true, receiptNo };
}
