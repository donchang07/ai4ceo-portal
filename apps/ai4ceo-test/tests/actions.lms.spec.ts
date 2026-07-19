// FR-9/10: 서버액션 · LMS 플로우 DB 단언 (04 + 08 핵심).
// 서버액션 자체는 암호화된 action-id 라 HTTP 직접호출이 어려워, 동일 RLS 경로(역할 토큰)로
// DB 쓰기·읽기를 수행해 저장 계약을 검증한다. 생성물은 teardown 에서 모두 정리한다.
import { test, expect } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, ".env.local") });

// @ts-expect-error — .mjs 헬퍼(타입 없음)
import { clientAs, admin, userId } from "./lib/supa.mjs";
import { DEMO_SESSION_ID, cleanupTestQa } from "./fixtures/lms";

const COHORT_18_ID = "00000000-0000-0000-0000-0000000000c1";

test.describe("서버액션 · LMS/관리자 DB 반영", () => {
  const createdQuestions: string[] = [];
  const createdSessions: string[] = [];
  let restoreApplication: { id: string; status: string } | null = null;

  test.afterAll(async () => {
    const svc = admin();
    await cleanupTestQa(createdQuestions).catch(() => {});
    for (const sid of createdSessions) {
      await svc.from("materials").delete().eq("session_id", sid).catch?.(() => {});
      await svc.from("videos").delete().eq("session_id", sid).catch?.(() => {});
      await svc.from("sessions").delete().eq("id", sid);
    }
    if (restoreApplication) {
      await svc.from("applications").update({ status: restoreApplication.status }).eq("id", restoreApplication.id);
    }
  });

  // --- LMS Q&A (재학생/강사) ---
  test("LMS-Q01 LMS-Q04 재학생 질문 등록 → author_name 저장 확인", async () => {
    const stu = await clientAs("student");
    const marker = `[테스트] 재학생 질문 ${Date.now()}`;
    const ins = await stu.from("session_questions").insert({
      session_id: DEMO_SESSION_ID,
      cohort_id: COHORT_18_ID,
      author_id: await userId("student"), // RLS sq_insert: author_id = auth.uid()
      body: marker,
      author_name: "재학 수강생",
    }).select("id, author_name, body").maybeSingle();

    expect(ins.error, ins.error?.message).toBeNull();
    expect(ins.data?.author_name).toBe("재학 수강생");
    if (ins.data?.id) createdQuestions.push(ins.data.id);

    // 재조회로 영속 확인
    const svc = admin();
    const { data } = await svc.from("session_questions").select("author_name, body").eq("id", ins.data?.id).maybeSingle();
    expect(data?.body).toBe(marker);
  });

  test("LMS-A02 강사(admin) 답변 is_instructor=true 저장", async () => {
    const svc = admin();
    // 대상 질문 시드(service)
    const { data: q } = await svc.from("session_questions").insert({
      session_id: DEMO_SESSION_ID,
      cohort_id: COHORT_18_ID,
      author_name: "[테스트] 질문자",
      body: "[테스트] 강사답변 대상",
    }).select("id").maybeSingle();
    test.skip(!q?.id, "질문 시드 실패");
    if (q?.id) createdQuestions.push(q.id);

    const adm = await clientAs("admin");
    const ins = await adm.from("session_answers").insert({
      question_id: q!.id,
      author_id: await userId("admin"), // RLS sa_insert: author_id = auth.uid()
      author_name: "관리자",
      body: "[테스트] 강사 답변입니다.",
      is_instructor: true,
      is_ai: false,
    }).select("id, is_instructor").maybeSingle();
    expect(ins.error, ins.error?.message).toBeNull();
    expect(ins.data?.is_instructor).toBe(true);
  });

  test("LMS-A03 AI 조교 답변 is_ai=true 저장 계약", async () => {
    // answerWithAi 저장 계약: is_ai=true 답변이 스레드에 저장됨. (RAG 내용/출처는 rag.smoke 로 검증)
    const svc = admin();
    const { data: q } = await svc.from("session_questions").insert({
      session_id: DEMO_SESSION_ID,
      cohort_id: COHORT_18_ID,
      author_name: "[테스트] 질문자",
      body: "[테스트] AI답변 대상",
    }).select("id").maybeSingle();
    test.skip(!q?.id, "질문 시드 실패");
    if (q?.id) createdQuestions.push(q.id);

    const adm = await clientAs("admin");
    const ins = await adm.from("session_answers").insert({
      question_id: q!.id,
      author_id: await userId("admin"), // RLS sa_insert: author_id = auth.uid()
      author_name: "AI 조교",
      body: "테스트 답변입니다.\n\n출처: 강의자료",
      is_instructor: false,
      is_ai: true,
    }).select("id, is_ai, body").maybeSingle();
    expect(ins.error, ins.error?.message).toBeNull();
    expect(ins.data?.is_ai).toBe(true);
    expect(ins.data?.body).toContain("출처");
  });

  // --- 관리자 서버액션 DB 반영 ---
  test("ADM-14 ADM-15 세션 삽입 + 인라인 저장 DB 반영", async () => {
    const adm = await clientAs("admin");
    const now = new Date();
    const ins = await adm.from("sessions").insert({
      cohort_id: COHORT_18_ID,
      week_no: null,
      title: "[테스트] 새 세션",
      type: "special",
      starts_at: now.toISOString(),
      ends_at: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(),
      description: "",
      is_published: false,
      sort_order: 999,
    }).select("id").maybeSingle();
    expect(ins.error, ins.error?.message).toBeNull();
    const sid = ins.data?.id as string | undefined;
    test.skip(!sid, "세션 삽입 실패(권한/스키마)");
    if (sid) createdSessions.push(sid);

    const upd = await adm.from("sessions").update({ title: "[테스트] 수정된 세션" }).eq("id", sid).select("title").maybeSingle();
    expect(upd.data?.title).toBe("[테스트] 수정된 세션");
  });

  test("LMS-ADM01 LMS-ADM04 영상 연결 + 자료 추가 DB 반영", async () => {
    const adm = await clientAs("admin");
    const now = new Date();
    const s = await adm.from("sessions").insert({
      cohort_id: COHORT_18_ID,
      week_no: null,
      title: "[테스트] 영상세션",
      type: "special",
      starts_at: now.toISOString(),
      ends_at: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(),
      is_published: false,
      sort_order: 998,
    }).select("id").maybeSingle();
    const sid = s.data?.id as string | undefined;
    test.skip(!sid, "세션 삽입 실패");
    if (sid) createdSessions.push(sid);

    const v = await adm.from("videos").insert({
      session_id: sid,
      google_drive_url: "https://www.youtube.com/watch?v=test",
      title: "[테스트] 영상",
      visibility: "cohort_readonly",
    }).select("id").maybeSingle();
    expect(v.error, v.error?.message).toBeNull();

    const m = await adm.from("materials").insert({
      session_id: sid,
      title: "[테스트] 자료",
      file_path: "https://example.com/x.pdf",
      version: 1,
    }).select("id").maybeSingle();
    expect(m.error, m.error?.message).toBeNull();
  });

  test("ADM-16 세션 reorder → sort_order DB 반영", async () => {
    const adm = await clientAs("admin");
    const now = new Date();
    const mk = (order: number, tag: string) =>
      adm.from("sessions").insert({
        cohort_id: COHORT_18_ID,
        week_no: null,
        title: `[테스트] 정렬세션 ${tag}`,
        type: "special",
        starts_at: now.toISOString(),
        ends_at: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(),
        is_published: false,
        sort_order: order,
      }).select("id, sort_order").maybeSingle();

    const a = await mk(991, "A");
    const b = await mk(992, "B");
    const aId = a.data?.id as string | undefined;
    const bId = b.data?.id as string | undefined;
    test.skip(!aId || !bId, "세션 삽입 실패");
    if (aId) createdSessions.push(aId);
    if (bId) createdSessions.push(bId);

    // reorder: A↔B sort_order 스왑
    await adm.from("sessions").update({ sort_order: 992 }).eq("id", aId);
    await adm.from("sessions").update({ sort_order: 991 }).eq("id", bId);

    const svc = admin();
    const { data: after } = await svc.from("sessions").select("id, sort_order").in("id", [aId, bId]);
    const map = Object.fromEntries((after ?? []).map((r) => [r.id, r.sort_order]));
    expect(map[aId!]).toBe(992);
    expect(map[bId!]).toBe(991);
  });

  test("LMS-ADM05 자료 삭제(deleteMaterial) → materials 삭제 반영", async () => {
    const adm = await clientAs("admin");
    const now = new Date();
    const s = await adm.from("sessions").insert({
      cohort_id: COHORT_18_ID,
      week_no: null,
      title: "[테스트] 자료삭제세션",
      type: "special",
      starts_at: now.toISOString(),
      ends_at: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(),
      is_published: false,
      sort_order: 997,
    }).select("id").maybeSingle();
    const sid = s.data?.id as string | undefined;
    test.skip(!sid, "세션 삽입 실패");
    if (sid) createdSessions.push(sid);

    const m = await adm.from("materials").insert({
      session_id: sid,
      title: "[테스트] 삭제대상 자료",
      file_path: "https://example.com/del.pdf",
      version: 1,
    }).select("id").maybeSingle();
    const mid = m.data?.id as string | undefined;
    expect(m.error, m.error?.message).toBeNull();
    test.skip(!mid, "자료 삽입 실패");

    const del = await adm.from("materials").delete().eq("id", mid);
    expect(del.error, del.error?.message).toBeNull();

    // 삭제 영속 확인(service role 재조회)
    const svc = admin();
    const { data: gone } = await svc.from("materials").select("id").eq("id", mid).maybeSingle();
    expect(gone).toBeNull();
  });

  test("ADM-10 선발 상태 변경 DB 반영(원복)", async () => {
    const svc = admin();
    const { data: app } = await svc.from("applications").select("id, status").limit(1).maybeSingle();
    test.skip(!app?.id, "applications 데이터 없음");
    restoreApplication = { id: app!.id, status: app!.status };

    const adm = await clientAs("admin");
    const next = app!.status === "accepted" ? "reviewing" : "accepted";
    const upd = await adm.from("applications").update({ status: next }).eq("id", app!.id).select("status").maybeSingle();
    expect(upd.error, upd.error?.message).toBeNull();
    expect(upd.data?.status).toBe(next);
  });
});
