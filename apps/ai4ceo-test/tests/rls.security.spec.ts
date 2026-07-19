// FR-7/8: RLS · API 직접 공격 (SEC-01~13, LMS-Q05/A06/A07, LMS-ADM07).
// 각 역할 access_token 으로 PostgREST/RPC 를 직접 호출해 방어를 검증. 브라우저 불필요.
import { test, expect } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, ".env.local") });

// @ts-expect-error — .mjs 헬퍼(타입 없음)
import { clientAs, anon, admin, userId } from "./lib/supa.mjs";
import { seedQuestion, cleanupTestQa, DEMO_SESSION_ID } from "./fixtures/lms";

const COHORT_18_ID = "00000000-0000-0000-0000-0000000000c1";

// 쓰기 거부 판정: 에러가 있거나(정책 거부) 반영된 행이 없음
function denied(res: { error: unknown; data: unknown }): boolean {
  if (res.error) return true;
  if (res.data == null) return true;
  if (Array.isArray(res.data) && res.data.length === 0) return true;
  return false;
}

test.describe("RLS · 직접 공격 방어", () => {
  const seededQuestions: string[] = [];

  test.afterAll(async () => {
    await cleanupTestQa(seededQuestions).catch(() => {});
  });

  // --- 벡터 DB ---
  test("SEC-05 재학생 match_rag_chunks RPC 거부(EXECUTE revoke)", async () => {
    const sb = await clientAs("student");
    const res = await sb.rpc("match_rag_chunks", {
      query_embedding: Array(1536).fill(0),
      match_count: 1,
    });
    expect(res.error, "RPC 는 권한 오류여야 함").not.toBeNull();
  });

  test("AI-15 anon match_rag_chunks RPC 거부", async () => {
    const sb = anon();
    const res = await sb.rpc("match_rag_chunks", {
      query_embedding: Array(1536).fill(0),
      match_count: 1,
    });
    expect(res.error).not.toBeNull();
  });

  test("SEC-06 anon rag_chunks 직접 select 빈 결과", async () => {
    const sb = anon();
    const { data } = await sb.from("rag_chunks").select("id").limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  // --- 조회 격리 ---
  test("SEC-03 재학생 applications 전체 조회 차단(admin only)", async () => {
    const stu = await clientAs("student");
    const { data: seen } = await stu.from("applications").select("id").limit(50);
    const svc = admin();
    const { count } = await svc.from("applications").select("id", { count: "exact", head: true });
    if ((count ?? 0) === 0) test.skip(true, "applications 데이터 없음 — 격리 판정 불가");
    expect((seen ?? []).length).toBe(0);
  });

  test("SEC-02 재학생이 타인(admin) profiles 조회 차단", async () => {
    const adminId = await userId("admin");
    test.skip(!adminId, "admin user id 조회 실패");
    const stu = await clientAs("student");
    const { data } = await stu.from("profiles").select("id").eq("id", adminId).maybeSingle();
    expect(data).toBeNull();
  });

  test("SEC-01 재학생 invoices 격리(전체 열람 불가)", async () => {
    const stu = await clientAs("student");
    const { data: seen } = await stu.from("invoices").select("id").limit(100);
    const svc = admin();
    const { count } = await svc.from("invoices").select("id", { count: "exact", head: true });
    if ((count ?? 0) === 0) test.skip(true, "invoices 데이터 없음");
    expect((seen ?? []).length).toBeLessThan(count ?? 0);
  });

  // --- 관리자 전용 쓰기 ---
  test("SEC-08 재학생 sessions update 거부", async () => {
    const stu = await clientAs("student");
    const res = await stu.from("sessions").update({ title: "[해킹시도]" }).eq("id", DEMO_SESSION_ID).select();
    expect(denied(res as any)).toBe(true);
  });

  test("SEC-09 비admin curriculum_change_logs 위조 거부", async () => {
    const stu = await clientAs("student");
    const res = await stu.from("curriculum_change_logs").insert({
      cohort_id: COHORT_18_ID,
      entity_type: "session",
      entity_id: DEMO_SESSION_ID,
      change_summary: "[위조]",
    }).select();
    expect(denied(res as any)).toBe(true);
  });

  test("SEC-12 졸업생 본인 membership status=active 위조 거부", async () => {
    const mem = await clientAs("alumniMember");
    const res = await mem.from("memberships").update({ status: "active" }).eq("status", "active").select();
    // self-update 는 거부(정책상 select 만) → 에러 또는 0행
    expect(denied(res as any)).toBe(true);
  });

  test("LMS-ADM07 재학생 videos 쓰기 거부", async () => {
    const stu = await clientAs("student");
    const res = await stu.from("videos").insert({
      session_id: DEMO_SESSION_ID,
      google_drive_url: "https://x.test/hack",
      title: "[해킹]",
      visibility: "cohort_readonly",
    }).select();
    expect(denied(res as any)).toBe(true);
  });

  test("LMS-ADM07 materials 재학생 쓰기 거부", async () => {
    const stu = await clientAs("student");
    const res = await stu.from("materials").insert({
      session_id: DEMO_SESSION_ID,
      title: "[해킹]",
      file_path: "https://x.test/hack",
      version: 1,
    }).select();
    expect(denied(res as any)).toBe(true);
  });

  // --- Q&A 권한 ---
  test("LMS-Q05 비수강생(관심자) session_questions insert 거부", async () => {
    const app = await clientAs("applicant");
    const res = await app.from("session_questions").insert({
      session_id: DEMO_SESSION_ID,
      cohort_id: COHORT_18_ID,
      body: "[해킹] 관심자 질문",
      author_name: "관심자",
    }).select();
    expect(denied(res as any)).toBe(true);
  });

  test("LMS-A06 비수강생(관심자) session_answers insert 거부", async () => {
    // 답변 대상 질문을 service role 로 시드
    const qid = await seedQuestion(null, "[테스트] RLS 답변 대상");
    test.skip(!qid, "질문 시드 실패");
    if (qid) seededQuestions.push(qid);
    const app = await clientAs("applicant");
    const res = await app.from("session_answers").insert({
      question_id: qid,
      body: "[해킹] 관심자 답변",
      author_name: "관심자",
      is_instructor: false,
      is_ai: false,
    }).select();
    expect(denied(res as any)).toBe(true);
  });
});
