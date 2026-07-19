# AI4CEO Portal MVP — Design Document

- Feature: `ai4ceo-portal-mvp`
- Source PRD: v2.6 / Design handoff (15 screens)
- Architecture: **Option C — Pragmatic Balance** (single Next.js 15 App Router app, modular `lib/` folders, Server Components first, Supabase SSR auth + RLS)

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | CEO 바이브코딩 스쿨의 모집→결제→교육→수료→AS 라이프사이클을 단일 포탈로 |
| WHO | guest/applicant, student(in_training), alumni(member), admin(장동인 교수) |
| RISK | 결제 실동작은 계좌이체만, 외부 API(팝빌/Drive/Solapi)는 mock/adapter, AI는 실동작 |
| SUCCESS | 15개 화면 + 데이터모델 + 인증 + AI조교 구현, `npm run build` 통과, Check ≥ 90 |
| SCOPE | 디자인 핸드오프 15개 화면 한정 (전체 PRD 40+ 라우트 아님) |

## 1. Overview

단일 `apps/ai4ceo` Next.js 15 앱. 모노레포 분리는 하지 않되 `lib/{core,notify,billing,drive,ai,db}` 모듈 폴더로 정리해 향후 분리 용이성 확보.

## 2. Module Map

| Module | Path | Responsibility |
|--------|------|----------------|
| core | `lib/core` | cn util, 상수(개강일/금액), status matrix |
| db | `lib/db` | Supabase server/client/admin, DB 타입 |
| notify | `lib/notify` | email(nodemailer 실발송), alimtalk(no-op 로그), notifications 큐 |
| billing | `lib/billing` | PaymentProvider 어댑터(bank_transfer 실동작/toss·smartstore 스텁), TaxInvoice(manual/popbill mock) |
| drive | `lib/drive` | URL-only 헬퍼(자동 업로드 없음) |
| ai | `lib/ai` | Anthropic 스트리밍 튜터, 컨텍스트 수집 |
| ui | `components/ui` | shadcn 스타일 프리미티브 |
| shells | `components` | portal-shell(라이트 사이드바), admin-shell(다크), mobile-tabbar |

## 3. Data Model

Supabase 마이그레이션 `supabase/migrations/`:
- `0001_schema.sql` — 26개 코어 테이블 + enum + RLS 전 테이블 적용
- `0002_seed.sql` — 18기 cohort + curriculum_templates v18(10주) + sessions 10 + admin profile

핵심 테이블: profiles, applications, referrals, cohorts, curriculum_templates, cohort_version_packs, enrollments, sessions, materials, videos, assignments, submissions, builds, chat_rooms, chat_members, chat_messages, chat_files, ai_question_logs, ai_context_sources, invoices, tax_invoices, payments, memberships, posts, curriculum_change_logs, notifications.

RLS: PRD 6.3 원칙 — cohort 소속(enrollments) 기반 SELECT, admin 전권, 본인 데이터(invoices/memberships/applications) 접근, posts audience 기반 읽기.

## 4. Routes (15 screens)

| # | Route | Screen | Type |
|---|-------|--------|------|
| 1a | `/` | 랜딩 | 공개 SSG |
| 1b/1d | `/portal/cohort` | Cohort Home (반응형) | student |
| 1c | `/portal/sessions/[id]` | 세션 상세 + 영상 Q&A | student |
| 1e | `/portal/chat` | 기수 대화방 | student |
| 1f | `/portal/ai` | AI 조교 | student |
| 1g | `/apply` | 지원서 7단계 | 공개 |
| 2a | `/admin` | 운영 대시보드 | admin |
| 2b | `/admin/applications` | 선발 관리 | admin |
| 2c | `/admin/curriculum` | 세션 인라인 편집 + Version Pack | admin |
| 2d | `/admin/billing` | 결제·세금계산서 | admin |
| 2e | `/alumni` | 동문 홈 | alumni |
| 2f | `/portal/billing` | 내 결제·인보이스 | student |
| 2g | `/trends` | AI 뉴스·브리프 피드 | 공개 + 잠금 |
| 2h | `/alumni/membership` | 멤버십 | alumni |

## 5. Auth & Status-gated UX

- Supabase Auth 이메일 매직링크 (`/login`, `/auth/callback`).
- `middleware.ts` 세션 갱신. 라우트 보호는 서버에서 `profiles.role` + `enrollments.status`.
- 상태 매트릭스: `lib/core/access.ts`.

## 6. AI Tutor (D-25)

- `/api/ai/tutor` Route Handler: Anthropic Messages 스트리밍.
- 컨텍스트: 해당 cohort의 sessions/materials/assignments 텍스트를 시스템 프롬프트에 주입.
- 응답: 본문 → 출처 칩 → 불확실성 문구. `ai_question_logs` + `ai_context_sources` 기록.

## 7. Notifications

- email: nodemailer SMTP(.env EMAIL_*). alimtalk/sms: `notifications` 테이블 status=queued 기록 + console 로그(no-op).
- 상태 전환 시 `notify(template_code, ...)` 호출.

## 8. Billing

- `PaymentProvider` 인터페이스: `bank_transfer`(실: 인보이스 발급 + 계좌 안내 + admin 수동 paid 전환), `toss`/`smartstore`(스텁).
- `TaxInvoiceProvider`: `manual`(기본, 시뮬레이션 로그) / `popbill`(mock 모드).

## 9. Design Tokens

디자인 핸드오프 README 우선. globals.css `@theme` 확장: canvas #F2F6FB, primary #2C5CE6 등. 상태 배지 = 중립 배경 + 6px dot. 카드 radius 14-16, 필 버튼 999px.

## 10. Test / Check Plan

- `npm run build` 무에러.
- gap-detector로 MVP 스코프(15화면+데이터모델+인증+AI) 대비 채점 ≥ 90.
