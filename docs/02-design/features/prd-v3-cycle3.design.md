# prd-v3-cycle3 Design (PDCA Design)

- **Date**: 2026-07-21 · **Plan**: [prd-v3-cycle3.plan.md](../../01-plan/features/prd-v3-cycle3.plan.md)

## 1. 마이그레이션

```sql
alter table session_questions alter column session_id drop not null;
```

RLS(`sq_read`/`sq_insert`/`sa_read`/`sa_insert`)는 전부 `cohort_id` 기준이라 무변경.

## 2. 파일 계획

| # | 파일 | 신규/수정 | 내용 |
|---|---|---|---|
| 1 | `supabase/migrations/20260721210000_qna_nullable_session.sql` | 신규 | 위 ALTER |
| 2 | `lib/db/types.ts` | 수정 | `Post`에 `id`(이미 있음)·`body_mdx` 추가, `QuestionWithAnswers.session_id`를 `string \| null`로 |
| 3 | `lib/db/queries.ts` | 수정 | `getPost(id)`(단일 조회, body_mdx 포함), `getGeneralQuestions(cohortId)`(session_id is null) 추가 |
| 4 | `app/trends/[slug]/page.tsx` | 신규 | post 조회 + `getCurrentUser()`(soft) + 게이트 판정 |
| 5 | `app/trends/[slug]/post-detail.tsx` | 신규 | 본문/잠금 티저 렌더 |
| 6 | `app/trends/trends-feed.tsx` | 수정 | 카드 제목을 `/trends/[id]` 링크로 (잠금 카드는 무변경) |
| 7 | `app/portal/qna/page.tsx` | 신규 | requireLmsAccess + getGeneralQuestions |
| 8 | `app/portal/qna/qna-board.tsx` | 신규 | SessionQa 패턴을 세션 비의존으로 이식 |
| 9 | `app/portal/qna/actions.ts` | 신규 | askGeneralQuestion·answerGeneralQuestion·answerGeneralWithAi (session-qa의 actions.ts와 별개 파일) |
| 10 | `components/portal-shell.tsx` | 수정 | nav에 "Q&A" 추가 |

## 3. F1 `/trends/[slug]` (F-1·F-5·F-6)

- 게이트 로직: `audience==='public'` → 전체 공개. 그 외 `getCurrentUser()` 결과로 `isAdmin(role)` → 전체 열람, `audience==='student'` → `canAccessLms(role,status)`, `audience==='alumni'` → `canAccessAlumni(role,status)`, `audience==='admin_only'` → `isAdmin(role)`만.
- 게이트 불충족: 목록 페이지의 잠금 카드와 동일한 톤(블러 처리된 excerpt + "지원하고 열람하기" CTA)의 티저를 리다이렉트 없이 렌더.
- 게이트 충족: 제목·카테고리·발행일·`body_mdx`(whitespace-pre-wrap)·태그·external_url(있으면 "원문 보기") 전부 표시.
- `trends-feed.tsx`는 잠금 아닌 카드의 제목만 `<Link href={`/trends/${post.id}`}>`로 감싸고 external_url 앵커는 형제 요소로 유지(중첩 앵커 금지).

## 4. F2 `/portal/qna` (D-10)

- 목록: `session_questions.select("*").is("session_id", null).eq("cohort_id", cohortId).order("created_at", desc)` + 각 질문의 `session_answers` 조인(기존 `getSessionQuestions`와 동일한 조합 로직, session_id 없는 버전).
- 질문 입력·답변·"AI 조교 답변 받기"는 `SessionQa`/`session-qa.tsx`의 UI를 그대로 이식하되 `sessionId` 파라미터를 제거(insert 시 `session_id: null`).
- `canAnswer`(강사 배지 표시)는 `isAdmin(user.role) || user.role === 'assistant'`로 기존과 동일.
- 답변 등록 시 알림톡 T-06(기존 재사용 대상, PRD §9) 연동은 이번 스코프에서는 생략 — 세션 Q&A 쪽도 현재 T-06 미연동 상태라 일관성 유지, 백로그에 명시.

## 5. 계약

- `getPost(id: string): Promise<(Post & {body_mdx: string}) | null>`
- `getGeneralQuestions(cohortId: string): Promise<QuestionWithAnswers[]>`
- `askGeneralQuestion(cohortId: string, body: string)`, `answerGeneralQuestion(questionId: string, body: string)`, `answerGeneralWithAi(questionId: string, questionBody: string)` — 전부 `revalidatePath('/portal/qna')`
