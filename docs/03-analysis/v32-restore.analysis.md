# ai4ceo-portal-v3.2-restore Analysis Report

> **Analysis Type**: Gap Analysis (Check phase)
> **Project**: ai4ceo (ai4ceo-portal) · **Date**: 2026-09-04
> **Design Doc**: [v32-restore.design.md](../02-design/features/v32-restore.design.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Supabase 프로젝트 삭제로 ai4ceo.app 전면 장애 |
| **WHO** | 18기 수강생 CEO·동반 임직원·동문·운영 관리자 |
| **RISK** | 마이그레이션 순서 파손 · RLS 누락 · env 교체 누락 |
| **SUCCESS** | Gap ≥95% · build/typecheck 통과 · advisor ERROR 0 · ai4ceo.app 200 |
| **SCOPE** | Do1 DB → Do2 env → Do3 build → Check → Act → QA → Deploy |

---

## Strategic Alignment Check

### PRD Alignment

| PRD 요소 | 기대 | 구현 상태 |
|---|---|---|
| 핵심 문제 (WHY) | 모집→수강→수료→AS 전 구간이 하나의 포탈에서 동작 | ✅ 39개 라우트 전부 존재·응답 |
| 대상 사용자 (WHO) | CEO·동반 임직원·동문·관리자 4역할 | ✅ RBAC 79개 RLS 정책으로 격리 |
| 가치 제안 | "죽은 포탈"의 복구 | ✅ ai4ceo.app 프로덕션 200, 신규 DB 실데이터 렌더 |

### Success Criteria Status

| # | Criteria (from Plan) | Status | Evidence |
|---|---|:---:|---|
| SC-1 | 마이그레이션 27개 전부 적용 | ✅ | `supabase_migrations.schema_migrations` = 27행 |
| SC-2 | public 테이블 존재 + 전부 RLS 활성 | ✅ | 테이블 40개 · `rls_disabled` = 0 · 정책 79개 |
| SC-3 | PRD 사이트맵 매칭률 ≥95% | ✅ | 39/39 = **100%** (Act 이전 35/39 = 89.7%) |
| SC-4 | build + typecheck 통과 | ✅ | `next build` 64/64 페이지 생성 · `tsc --noEmit` 0 error |
| SC-5 | security advisor ERROR 0건 | ✅ | ERROR 0 · WARN/INFO만 (§3.3 참조) |
| SC-6 | ai4ceo.app 프로덕션 배포 READY | ✅ | `dpl_GcHSGTKSRePhZv4SUiQde5o49LSB` target=production, readyState=READY |

**Success Rate**: 6/6

### Decision Record Verification

| Source | Decision | Followed? | 비고 |
|---|---|:---:|---|
| [Plan] | service_role 클라이언트 신설 금지 | ✅ | 신규 코드 없음 |
| [Design] | Option C — 파일 1개 = 마이그레이션 1건 순차 적용 | ✅ | 저장소 27파일 ↔ 원격 27행 1:1 |
| [Design] | 신규 화면은 기존 admin 레이아웃·토큰 재사용 | ✅ | `AdminShell` + `components/ui` 만 사용, 신규 디자인 없음 |
| [Design] | 배포는 저장소 루트에서 | ✅ | `vercel --prod` at repo root |

---

## 1. 분석 개요

- 기준 문서: `docs/prd/prd-v3.2.md` §7.2 사이트맵 (39개 라우트)
- 구현 경로: `apps/ai4ceo/app/**/page.tsx` (54개)
- 분석 일자: 2026-09-04

---

## 2. Gap Analysis

### 2.1 라우트 커버리지 (Structural)

Act 이전 누락 4건 → Act에서 전부 구현.

| 라우트 | Act 이전 | Act 이후 | 구현 파일 |
|---|:---:|:---:|---|
| /admin/referrals | ❌ | ✅ | `app/admin/referrals/page.tsx` |
| /admin/notifications | ❌ | ✅ | `app/admin/notifications/page.tsx` |
| /admin/chat | ❌ | ✅ | `app/admin/chat/page.tsx` |
| /admin/drive-policy | ❌ | ✅ | `app/admin/drive-policy/page.tsx` |
| 나머지 35건 | ✅ | ✅ | 기존 소스 |

**Structural Match Rate: 39/39 = 100%**

PRD 사이트맵 외 추가 구현 15건(`/checkout/*`, `/pay/*`, `/contact`, `/set-password`, `/admin/bookings`, `/admin/inquiries`, `/admin/security`, `/admin-device`, `/admin-verify`, `/portal/files`, `/portal/profile`)은 v3.1~v3.2 결제·보안 보강분으로, 사이트맵 미기재는 **PRD 문서 측 갱신 필요**(§10).

### 2.2 데이터 모델

| 항목 | 설계(마이그레이션) | 실제 DB | 상태 |
|---|---|---|:---:|
| 테이블 | 40 | 40 | ✅ |
| RLS 정책 | — | 79 | ✅ |
| RLS 미적용 테이블 | 0 | 0 | ✅ |
| 확장 | pgcrypto, vector | 설치됨 | ✅ |
| 시드 (18기) | cohort 1 · session 10 | cohort 1 · session 10 | ✅ |

`sessions` 11건 → 10건: `20260811130000_remove_seeded_offline_supplement.sql`이 오프라인 보충 회차를 의도적으로 제거 — 설계대로.

### 2.3 기능 깊이 (Functional Depth)

| 신규 파일 | 깊이 | 근거 | 미구현 요소 |
|---|:---:|---|---|
| `admin/referrals/page.tsx` | 100 | 실 집계(코드별 지원·합격·전환율), 목업 없음 | — |
| `admin/notifications/page.tsx` | 90 | `notifications` + `notification_outbox` 2계층 실 조회 | 수동 발송 액션 (PRD G-4, M4) |
| `admin/chat/page.tsx` | 70 | 방별 참여자·대화·파일 집계 + Drive 폴더 링크 | 메시지 검색·고정 메시지 관리 (M4) |
| `admin/drive-policy/page.tsx` | 75 | 영상 read-only 위반·파일 권한·폴더 미연결 탐지 | Drive API 동기화·오류 재시도 (M4) |
| 기존 35개 라우트 | 100 | 기존 사이클에서 검증 완료, 이번 변경 없음 | — |

**Functional Match Rate: 37.5/39 = 96.2%**

### 2.4 API Contract

| 계층 | 항목 | 상태 |
|---|---|:---:|
| API 라우트 | 9건 (`/api/ai/tutor`, `/api/payments/*` 5건, `/api/applications/status`, `/api/auth/finalize`, `/api/admin/invoices/[id]/confirm`) | ✅ 변경 없음 |
| DB RPC | `lookup_application_status` · `set_billing_delegate` · `request_tax_invoice` · `confirm_invoice_paid`(1·2 arity) · `record_payment_requested` · `payment_lookup` · `finalize_payment_confirmed` · `fail_payment` · `reconcile_billing` · `current_user_context` · `list_locked_archive_metadata` · `match_rag_chunks` | ✅ 전부 생성 |
| 신규 화면 | 서버 컴포넌트 직접 조회 — 신규 API 계약 없음 | ✅ |

**Contract Match Rate: 100%**

### 2.5 Runtime Verification

#### L1 — HTTP 엔드포인트

| # | 대상 | 기대 | 실측 | Pass |
|---|---|---|---|:---:|
| 1-5 | 로컬 `/`, `/program`, `/trends`, `/apply`, `/login` | 200 | 200 | ✅ |
| 6 | Supabase anon REST `sessions` | 시드 3건 | 1~3주차 제목 반환 | ✅ |
| 7 | Supabase anon REST `cohorts` | 18기 · 2026-09-09 · capacity null | 일치 | ✅ |
| 8-9 | `https://ai4ceo.app`, `https://www.ai4ceo.app` | 200 | 200 | ✅ |
| 10-13 | 프로덕션 `/program`, `/trends`, `/apply`, `/login` | 200 | 200 | ✅ |
| 14 | 프로덕션 `/program` 본문 | 신규 DB 시드 강의명 렌더 | "Claude Code 실전 세팅", "종합 프로젝트 발표" | ✅ |
| 15-18 | 프로덕션 신규 admin 4개 라우트 | 비로그인 시 `/login?next=/admin` 리디렉트 | 308→200 login | ✅ |

**L1 Score: 18/18 = 100%**

#### L2 / L3 — UI 액션 · E2E

**미측정.** 인증이 필요한 화면(포탈·관리자·결제)은 테스트 계정과 신규 프로젝트의 auth 사용자가 아직 없어 실행하지 않았다. 0%가 아니라 **측정하지 않음**이다. 최초 관리자 로그인 이후 별도 QA 사이클에서 실행해야 한다.

**Runtime Match Rate (L1 기준): 100%**

### 2.6 Match Rate Summary

```
┌──────────────────────────────────────────────┐
│  Structural Match Rate:  100.0%              │
│  Functional Match Rate:   96.2%              │
│  Contract Match Rate:    100.0%              │
│  Runtime Match Rate (L1): 100.0%  (L2/L3 미측정)│
│  ──────────────────────────────────────────  │
│  Overall (정적 전용, 보수적 하한):  98.5%      │
│    = 100×0.2 + 96.2×0.4 + 100×0.4            │
│  Overall (L1 런타임 포함):          99.1%      │
│    = 100×.15 + 96.2×.25 + 100×.25 + 100×.35  │
├──────────────────────────────────────────────┤
│  ✅ Match:           39 라우트 (100%)          │
│  ⚠️ Shallow:          3 화면 (M4 잔여 기능)     │
│  ❌ Not implemented:  0                        │
└──────────────────────────────────────────────┘
```

**게이트 판정: 보수적 하한 98.5% ≥ 95% → PASS**

---

## 3. 코드 품질·보안

### 3.1 규약 준수

| 항목 | 기준 | 실측 | 상태 |
|---|---|---|:---:|
| `any` 타입 | 0건 | 0건 (`retrieval.ts:39`는 주석) | ✅ |
| `console.log` | 0건 | 4건 (전부 기존 코드) | ⚠️ |
| 서버 컴포넌트 우선 | 신규 4화면 | 4/4 서버 컴포넌트 | ✅ |
| 페이지 가드 직접 호출 | `/admin/*` | `app/admin/layout.tsx`가 role+기기+MFA 가드 | ✅ |
| 신규 의존성 | 0 | 0 | ✅ |

`console.log` 4건은 `lib/billing/tax-invoice.ts`(2), `lib/notify/email.ts`(1), `lib/notify/index.ts`(1)의 기존 운영 로그로, 이번 변경 범위 밖이라 손대지 않았다.

### 3.2 Supabase Security Advisor

**ERROR 0건.** 나머지는 원본 스키마 설계에서 그대로 승계된 항목이다.

| 레벨 | 건수 | 내용 | 판정 |
|---|:---:|---|---|
| INFO | 2 | `rag_files`·`rag_chunks` RLS 활성·정책 없음 | **의도된 설계** — 마이그레이션 주석에 "service-role만 접근" 명시 |
| WARN | 1 | `vector` 확장이 public 스키마에 설치 | Supabase 기본 동작 |
| WARN | 1 | `promote_paid_enrollment` search_path 가변 | SECURITY DEFINER 아님 — 위험도 낮음 |
| WARN | 20+ | SECURITY DEFINER 함수가 RPC로 노출 | 함수 내부에서 `is_admin()`/소유권 검사로 방어 — 원본 설계 그대로 |

### 3.3 잔여 위험

| 위험 | 영향 | 조치 필요 |
|---|---|:---:|
| `SUPABASE_SERVICE_ROLE_KEY`가 삭제된 구 프로젝트 키 (로컬·Vercel 양쪽) | AI 조교 RAG 검색(`lib/ai/retrieval.ts`) 및 `scripts/rag-sync.mjs` 동작 불가 | **필요** |
| 신규 프로젝트 `auth.users` 0명 — 관리자 프로필 없음 | 최초 관리자 온보딩 필요 | **필요** |
| RAG 인덱스(`rag_files`/`rag_chunks`) 비어 있음 | AI 조교가 강의자료 근거 없이 답변 | 권장 |
| 트리거 함수가 RPC로 노출 | 낮음 (전부 무해하거나 권한 검사 포함) | 선택 |

---

## 4. 권장 조치

### 4.1 즉시 (배포 직후)

| 우선 | 항목 | 방법 |
|:---:|---|---|
| 🔴 1 | 관리자 계정 생성 | `donchang0725@gmail.com`으로 매직링크 로그인 → `20260719090100_seed.sql`의 admin 승격 구문 재실행 (또는 `ADMIN_EMAIL` 부트스트랩 폴백) |
| 🔴 2 | `SUPABASE_SERVICE_ROLE_KEY` 교체 | Supabase 대시보드에서 신규 프로젝트 service_role 키 발급 → `.env.local` + Vercel(production/preview) 갱신 |

### 4.2 단기 (1주)

| 우선 | 항목 | 기대 효과 |
|:---:|---|---|
| 🟡 1 | L2/L3 인증 시나리오 QA 실행 | 포탈·결제·관리자 경로 실동작 검증 |
| 🟡 2 | RAG 재색인 (`npm run rag:sync`) | AI 조교 답변 근거 복원 |

### 4.3 장기 (백로그, M4)

| 항목 | 화면 |
|---|---|
| 대화방 메시지 검색·고정 메시지 관리 | `/admin/chat` |
| Drive API 동기화·권한 오류 재시도 | `/admin/drive-policy` |
| 알림 수동 발송 | `/admin/notifications` |

---

## 5. PRD 문서 갱신 필요

- [ ] §7.2 사이트맵에 v3.1~v3.2 추가 화면 15건 반영 (`/checkout/*`, `/pay/*`, `/contact`, `/set-password`, `/admin/bookings`, `/admin/inquiries`, `/admin/security`, `/admin-device`, `/admin-verify`, `/portal/files`, `/portal/profile`)

---

## Version History

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-09-04 | 최초 분석 (Act 반영 후) | 장동인 교수 |
