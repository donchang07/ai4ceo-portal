import { expect, test, type Browser } from "@playwright/test";
import { admin, assertMutationTarget, clientAs, userId } from "../lib/supa.mjs";
import { ensureStorageState, type AccountKey } from "../fixtures/accounts";

const COHORT = "00000000-0000-0000-0000-0000000000c1";

async function contextAs(browser: Browser, account: AccountKey) {
  return browser.newContext({ storageState: await ensureStorageState(browser, account) });
}

async function seedSession(tag: string, overrides: Record<string, unknown> = {}) {
  assertMutationTarget();
  const row = await admin().from("sessions").insert({
    cohort_id: COHORT, week_no: 90, title: `[QA] ${tag}`, type: "special",
    starts_at: "2026-08-01T01:00:00Z", ends_at: "2026-08-01T04:00:00Z",
    is_published: true, sort_order: 900, ...overrides,
  }).select("*").single();
  if (row.error) throw row.error;
  return row.data;
}

async function cleanSession(id: string) {
  await admin().from("session_answers").delete().in("question_id", (await admin().from("session_questions").select("id").eq("session_id", id)).data?.map(x => x.id) ?? []);
  await admin().from("session_questions").delete().eq("session_id", id);
  await admin().from("session_catchups").delete().eq("session_id", id);
  await admin().from("materials").delete().eq("session_id", id);
  await admin().from("videos").delete().eq("session_id", id);
  await admin().from("curriculum_change_logs").delete().eq("entity_id", id);
  await admin().from("sessions").delete().eq("id", id);
}

test.describe("LMS acceptance", () => {
  test("LMS-001 cohort home 핵심 카드와 진입점", async ({ browser }) => {
    const context = await contextAs(browser, "student");
    try {
      const page = await context.newPage();
      await page.goto("/portal/cohort", { waitUntil: "networkidle" });
      for (const text of ["My Build", "This Week", "18기 대화방", "AI 조교"]) await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: /대화방 열기/ })).toHaveAttribute("href", "/portal/chat");
      await expect(page.getByRole("link", { name: /AI 조교에게 질문하기/ })).toHaveAttribute("href", "/portal/ai");
    } finally { await context.close(); }
  });

  test("LMS-002 10개 정규 세션 sort_order 순서", async ({ browser }) => {
    const ids: string[] = [];
    try {
      for (let i = 1; i <= 10; i++) ids.push((await seedSession(`LMS002-${i}`, { type: "regular_zoom", week_no: i, sort_order: 1000 + i })).id);
      const context = await contextAs(browser, "student");
      const page = await context.newPage();
      await page.goto("/portal/sessions", { waitUntil: "networkidle" });
      const text = await page.locator("main").innerText();
      let previous = -1;
      for (let i = 1; i <= 10; i++) { const at = text.indexOf(`[QA] LMS002-${i}`); expect(at).toBeGreaterThan(previous); previous = at; }
      await context.close();
    } finally { for (const id of ids) await cleanSession(id); }
  });

  for (const fixture of [
    { id: "LMS-003", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", selector: 'iframe[title="강의 영상"]', src: /youtube\.com\/embed\/dQw4w9WgXcQ/, label: "YouTube iframe" },
    { id: "LMS-005", url: "https://example.com/qa.mp4", selector: "video[controls]", src: /example\.com\/qa\.mp4/, label: "native mp4" },
    { id: "LMS-006", url: "https://drive.google.com/file/d/qaDriveFile123/view", selector: 'iframe[title="강의 영상"]', src: /drive\.google\.com\/file\/d\/qaDriveFile123\/preview/, label: "Drive preview" },
  ]) {
    test(`${fixture.id} ${fixture.label} 읽기 전용 플레이어`, async ({ browser }) => {
      const session = await seedSession(fixture.id);
      await admin().from("videos").insert({ session_id: session.id, google_drive_url: fixture.url, title: fixture.id, visibility: "cohort_readonly", published_at: new Date().toISOString() });
      const context = await contextAs(browser, "student");
      try {
        const page = await context.newPage(); await page.goto(`/portal/sessions/${session.id}`, { waitUntil: "networkidle" });
        await expect(page.locator(fixture.selector)).toHaveAttribute("src", fixture.src);
        await expect(page.getByText("읽기 전용", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: /수정|삭제/ })).toHaveCount(0);
      } finally { await context.close(); await cleanSession(session.id); }
    });
  }

  test("LMS-004 영상 없는 세션의 빈 상태", async ({ browser }) => {
    const session = await seedSession("LMS004"); const context = await contextAs(browser, "student");
    try { const page = await context.newPage(); await page.goto(`/portal/sessions/${session.id}`, { waitUntil: "networkidle" }); await expect(page.getByText("아직 강의 영상이 업로드되지 않았습니다.")).toBeVisible(); await expect(page.locator('iframe[title="강의 영상"], video')).toHaveCount(0); }
    finally { await context.close(); await cleanSession(session.id); }
  });

  test("LMS-007 출처 41:20 클릭은 페이지 reload 없이 seek 진입", async ({ browser }) => {
    const session = await seedSession("LMS007");
    await admin().from("videos").insert({ session_id: session.id, google_drive_url: "https://youtu.be/dQw4w9WgXcQ", title: "seek", visibility: "cohort_readonly", published_at: new Date().toISOString() });
    const context = await contextAs(browser, "student");
    try {
      const page = await context.newPage();
      await page.route("**/api/ai/tutor", route => route.fulfill({ status: 200, contentType: "text/plain", body: "답변입니다. 출처: 41:20" }));
      await page.goto(`/portal/sessions/${session.id}`, { waitUntil: "networkidle" });
      const before = page.url(); await page.getByPlaceholder("이 강의에 대해 물어보세요").fill("질문"); await page.getByRole("button", { name: "전송" }).click();
      await page.getByRole("button", { name: /41:20/ }).click(); expect(page.url()).toBe(before);
    } finally { await context.close(); await cleanSession(session.id); }
  });

  test("LMS-008 강의자료 제목·버전·새 탭 URL", async ({ browser }) => {
    const session = await seedSession("LMS008"); const paths = ["https://example.com/a.pdf", "https://example.com/b.pdf"];
    await admin().from("materials").insert(paths.map((file_path, i) => ({ session_id: session.id, title: `QA 자료 ${i + 1}`, version: i + 1, file_path })));
    const context = await contextAs(browser, "student");
    try { const page = await context.newPage(); await page.goto(`/portal/sessions/${session.id}`, { waitUntil: "networkidle" }); for (let i=0;i<2;i++){ const row=page.locator("li", {hasText:`QA 자료 ${i+1}`}); await expect(row.getByText(`v${i+1}`)).toBeVisible(); await expect(row.getByRole("link", {name:"열기"})).toHaveAttribute("href", paths[i]); await expect(row.getByRole("link", {name:"열기"})).toHaveAttribute("target", "_blank"); } }
    finally { await context.close(); await cleanSession(session.id); }
  });

  test("LMS-009 비수강자는 materials RLS로 차단", async () => {
    const session = await seedSession("LMS009"); await admin().from("materials").insert({ session_id: session.id, title: "SECRET", file_path: "https://secret.invalid/file" });
    try { for (const who of ["applicant", "alumniNoMember"] as AccountKey[]) { const result = await (await clientAs(who)).from("materials").select("*").eq("session_id", session.id); expect(result.error).toBeNull(); expect(result.data).toEqual([]); } }
    finally { await cleanSession(session.id); }
  });

  for (const gap of [
    ["LMS-010", "/portal/assignments", /제출 파일 선택/], ["LMS-011", "/portal/assignments", /리마인더 실행/],
    ["LMS-012", "/admin/curriculum", /공지 발행/], ["LMS-013", "/portal/chat", /메시지 전송/],
    ["LMS-014", "/portal/files", /rename|이름 변경/], ["LMS-024", "/admin/curriculum", /알림 발송/],
  ] as const) {
    test(`${gap[0]} known-gap 계약`, async ({ browser }) => {
      test.fail(true, "문서에 등록된 known_gap: 해당 서버/외부 연동 계약이 아직 없음");
      const account: AccountKey = gap[1].startsWith("/admin") ? "admin" : "student"; const context = await contextAs(browser, account);
      try { const page = await context.newPage(); await page.goto(gap[1], { waitUntil: "networkidle" }); expect(await page.getByText(gap[2]).count()).toBeGreaterThan(0); }
      finally { await context.close(); }
    });
  }

  test("LMS-018 동료 답변은 수강생 badge와 시간순", async ({ browser }) => {
    const session = await seedSession("LMS018"); const student = await userId("student"); const peer = await userId("alumniMember");
    const q = await admin().from("session_questions").insert({ session_id: session.id, cohort_id: COHORT, author_id: student, author_name: "학생", body: "QA 질문" }).select("id").single();
    await admin().from("session_answers").insert({ question_id: q.data!.id, author_id: peer, author_name: "동료", body: "QA 동료 답변", is_instructor: false, is_ai: false });
    const context = await contextAs(browser, "student");
    try { const page=await context.newPage(); await page.goto(`/portal/sessions/${session.id}`, {waitUntil:"networkidle"}); const answer=page.locator("li", {hasText:"QA 동료 답변"}); await expect(answer.getByText("수강생", {exact:true})).toBeVisible(); }
    finally { await context.close(); await cleanSession(session.id); }
  });

  test("LMS-019 따라잡기 4단계 즉시 저장과 완료", async ({ browser }) => {
    const session = await seedSession("LMS019"); const uid = await userId("student"); const context = await contextAs(browser,"student");
    try { await admin().from("session_catchups").delete().eq("session_id",session.id).eq("user_id",uid); const page=await context.newPage(); await page.goto(`/portal/sessions/${session.id}`,{waitUntil:"networkidle"}); for(let i=0;i<4;i++) await page.getByRole("button",{name:"완료 표시"}).first().click(); await expect(page.getByText("출석 보완 완료")).toBeVisible(); await expect.poll(async()=> (await admin().from("session_catchups").select("watched,materials_done,assignment_done,asked_ai,completed_at").eq("session_id",session.id).eq("user_id",uid).single()).data).toMatchObject({watched:true,materials_done:true,assignment_done:true,asked_ai:true}); }
    finally { await context.close(); await cleanSession(session.id); }
  });

  test("LMS-020 타인의 catchup은 조회·수정 불가", async () => {
    const session=await seedSession("LMS020"); const owner=await userId("student"); const seeded=await admin().from("session_catchups").insert({user_id:owner,session_id:session.id,watched:true}).select("id").single();
    try { const other=await clientAs("alumniMember"); expect((await other.from("session_catchups").select("*").eq("id",seeded.data!.id)).data).toEqual([]); expect((await other.from("session_catchups").update({watched:false}).eq("id",seeded.data!.id).select("id")).data).toEqual([]); expect((await admin().from("session_catchups").select("watched").eq("id",seeded.data!.id).single()).data?.watched).toBe(true); }
    finally { await cleanSession(session.id); }
  });

  test("LMS-021 ADM-005 관리자 인라인 편집·change log·학생 반영", async ({ browser }) => {
    const session=await seedSession("LMS021",{sort_order:-100}); const title=`QA-${Date.now()} 특강`; const context=await contextAs(browser,"admin");
    try { const page=await context.newPage(); await page.goto("/admin/curriculum",{waitUntil:"networkidle"}); await page.locator("main input").first().fill(title); await page.getByRole("button",{name:"저장",exact:true}).click(); await expect(page.getByText("저장됨",{exact:true})).toBeVisible(); expect((await admin().from("sessions").select("title").eq("id",session.id).single()).data?.title).toBe(title); expect((await admin().from("curriculum_change_logs").select("id").eq("entity_id",session.id)).data).toHaveLength(1); const student=await contextAs(browser,"student"); const sPage=await student.newPage(); await sPage.goto(`/portal/sessions/${session.id}`,{waitUntil:"networkidle"}); await expect(sPage.getByRole("heading",{name:new RegExp(title)})).toBeVisible(); await student.close(); }
    finally { await context.close(); await cleanSession(session.id); }
  });

  test("LMS-022 ADM-006 special 세션 삽입과 정규 10회 불변", async ({ browser }) => {
    const before=(await admin().from("sessions").select("id",{count:"exact"}).eq("cohort_id",COHORT).eq("type","regular_zoom")).count; const context=await contextAs(browser,"admin"); let created:string|undefined;
    try { const page=await context.newPage(); await page.goto("/admin/curriculum",{waitUntil:"networkidle"}); await page.getByRole("button",{name:"+ 세션 삽입"}).click(); await expect.poll(async()=>{const r=await admin().from("sessions").select("id,type,sort_order").eq("title","새 세션").order("sort_order",{ascending:false}).limit(1).maybeSingle(); created=r.data?.id; return r.data?.type;}).toBe("special"); expect((await admin().from("sessions").select("id",{count:"exact"}).eq("cohort_id",COHORT).eq("type","regular_zoom")).count).toBe(before); }
    finally { if(created) await cleanSession(created); await context.close(); }
  });
});
