# prd-v3-cycle3 Plan (PDCA Plan)

- **Date**: 2026-07-21 · **PRD 정본**: `ai4ceo-portal-PRD-v3_0.docx` §4.4(D-10), §4.6(F-1), §7.2(사이트맵)
- **선행 사이클**: prd-v283-core → prd-v30-final(§7.3 완결) → prd-v3-m2-booking(D-12·D-13)
- **사용자 지시**: "toss payment, popbill 세금계산서를 제외한 나머지 부분을 순차적으로" — C-8(Toss)·C-10(팝빌 실발행)은 앞으로도 전 사이클에서 계속 제외. 그 외 §7.2 잔여 라우트를 사이즈가 맞는 슬라이스로 계속 진행.

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 트렌드/브리프 글이 목록의 요약만 노출되고 본문(body_mdx)을 읽을 화면이 없음(F-1 미완결) · 수강생 질문이 세션 단위로만 존재해 "대화방에서 반복되는 질문을 지식으로 승격"할 일반 게시판이 없음(D-10) |
| **WHO** | 비로그인 방문자·수강생·동문·admin(트렌드 상세) · 재학생·assistant·admin(Q&A 게시판) |
| **RISK** | `session_questions.session_id`를 nullable로 바꿔야 함 — 기존 세션별 Q&A(D-22)에 영향 없어야 함 |
| **SUCCESS** | build+tsc 통과, Check ≥90%, Supabase 적용, main push, Vercel 배포 |
| **SCOPE** | F1 `/trends/[slug]` 상세(권한별 열람) · F2 `/portal/qna` 일반 게시판 |

## 제외 (사용자 지시 고정)

- C-8 Toss Payments 실연동, C-10 팝빌 실발행 — 어댑터 구조 자체는 기존 스키마에 이미 있고 활성화만 보류. **앞으로 모든 사이클에서 계속 제외.**

## Features

| # | 내용 | PRD 근거 |
|---|---|---|
| F1 | `/trends/[slug]` — post 상세. `body_mdx` 전문 노출, audience(public/student/alumni/admin_only)별 열람 게이트, 미충족 시 목록의 잠금 카드와 동일한 "지원하기" 유도 | F-1·F-5·F-6, P0 |
| F2 | `/portal/qna` — 재학생 전용 일반 Q&A 게시판. 기존 세션별 질의응답(D-22) 패턴을 재사용하되 특정 세션에 묶이지 않는 스레드 | D-10, P1 |

## 스코프 밖(백로그로 명시)

- H-7·H-9·H-13·H-14 관리자 콘솔, `/admin/cohorts`·`/admin/version-packs`·`/admin/drive-policy`·`/admin/chat`
- `/alumni/profile`·`/alumni/directory`·`/alumni/[profileSlug]`(E-6·E-10, M4)
- `/admin/referrals`(J-3, M4)·`/admin/notifications`(H-5 수동 발송, M1 잔여)
- Toss/팝빌 실연동(사용자 지시로 항상 제외)

## 사전 결정

| # | 결정 | 근거 |
|---|---|---|
| D-1 | `/trends/[slug]`의 `[slug]`는 실제로 `post.id` — `posts` 테이블에 별도 slug 컬럼이 없고, 새로 추가할 실익도 없음 | 스키마 변경 최소화 원칙 유지 |
| D-2 | body_mdx는 마크다운 렌더러 없이 `whitespace-pre-wrap` 텍스트로 렌더 | 기존 admin/contents 폼도 body_mdx를 단순 textarea로만 다룸(MDX 에디터 아님) — 렌더러 신규 설치는 과잉 |
| D-3 | 상세 페이지 접근 불가 시 리다이렉트가 아니라 **목록의 잠금 카드와 동일한 인라인 티저**를 보여줌 | 공유 링크로 들어온 비로그인 방문자를 그대로 전환 퍼널(지원하기)로 유도하는 게 기존 UX와 일관 |
| D-4 | `/portal/qna`는 신규 테이블 없이 `session_questions`(session_id를 nullable로 변경)·`session_answers` 재사용, `session_id is null`인 행이 일반 게시판 | RLS가 이미 `cohort_id` 기준이라 session_id 유무와 무관하게 그대로 작동(검증 완료) — D-22(세션별 Q&A)에 영향 없음 |
| D-5 | 기존 `app/portal/sessions/[id]/actions.ts`(askQuestion 등)는 건드리지 않고, `/portal/qna` 전용 액션 파일을 새로 작성 | 이미 동작 중인 세션 Q&A 코드에 분기 로직을 얹지 않아 회귀 위험 제거 |

## Success Criteria

- **SC-1**: `/trends/[slug]`·`/portal/qna` 렌더, next build 통과
- **SC-2**: `session_questions.session_id` NOT NULL 제약 제거(마이그레이션 1개), 기존 세션별 Q&A 동작 무변경
- **SC-3**: audience 게이트 4종(public/student/alumni/admin_only) 전부 검증
- **SC-4**: Gap ≥90%
- **SC-5**: Supabase 적용 + main push + Vercel 배포
