# ai4ceo-portal-v3.2-restore Design Document

> **Project**: ai4ceo (ai4ceo-portal) · **Date**: 2026-09-04 · **Plan**: [v32-restore.plan.md](../../01-plan/features/v32-restore.plan.md)

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

## 1. Overview

기존 소스코드는 유지하고 **백엔드 상태만 재구축**하는 복구형 설계다. 코드 변경은 (a) 환경변수 값, (b) 갭 분석에서 드러난 미구현 라우트 추가로 한정한다.

## 2. 아키텍처 선택

3개 안을 비교하고 **Option C (실용적 균형)** 을 채택한다.

| 옵션 | 내용 | 복잡도 | 회귀 위험 | 소요 | 채택 |
|---|---|:---:|:---:|:---:|:---:|
| A. 최소 변경 | 마이그레이션 27개를 한 덩어리로 합쳐 1회 적용 | 낮음 | **높음** (실패 지점 특정 불가) | 짧음 | ☐ |
| B. 스키마 재작성 | PRD §6.3 기준으로 스키마를 새로 설계·작성 | 높음 | **높음** (코드와 불일치) | 김 | ☐ |
| **C. 순차 재적용** | 파일 1개 = 마이그레이션 1건으로 타임스탬프 순 적용, 저장소와 DB 이력 1:1 유지 | 중간 | 낮음 | 중간 | ☑ |

**채택 근거**: 저장소의 `supabase/migrations/`와 원격 `supabase_migrations.schema_migrations`가 1:1로 맞아야 이후 `supabase db push`/`db diff`가 정상 동작한다. 실패 시 어느 파일에서 깨졌는지 즉시 특정된다.

## 3. 데이터 모델

PRD §6.3 기준. 마이그레이션 27개가 정의하는 도메인 그룹:

| 그룹 | 대표 테이블 | 마이그레이션 |
|---|---|---|
| 코어 | `profiles`, `cohorts`, `enrollments`, `sessions`, `applications` | `20260719090000_schema.sql` |
| 시드 | 18기 + 커리큘럼 v18 + 10주 세션 | `20260719090100_seed.sql` |
| RAG | `rag_documents` (pgvector) | `20260719130000_rag_vectors.sql` |
| Q&A / AI | `session_qa`, `ai_question_logs` | `20260719140000`, `20260723*` |
| v3 화면 | delegated tasks · roadmap · builds · version packs | `20260721000000_prd_v3_screens.sql` |
| 결제 | `invoices`, `tax_invoices`, billing RPC | `20260721010000`, `20260723060000` |
| 예약 | `session_bookings` | `20260721200000`, `20260721220000` |
| 동문 | `alumni_profiles`, membership | `20260721230000`, `20260811110*` |
| 운영 | `inquiries`, `admin_devices` | `20260811100000`, `20260811120000` |

### 3.1 확장

- `pgcrypto` — `schema.sql` L5
- `vector` — `rag_vectors.sql` L3

### 3.2 RLS 원칙

본인 self-access + `is_admin()` / `is_enrolled()`. 모든 `public` 테이블은 RLS 활성이 필수이며, security advisor ERROR 0건으로 검증한다.

## 4. 환경변수 교체 설계

| 위치 | 키 | 조치 |
|---|---|---|
| `apps/ai4ceo/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 신규 프로젝트 값으로 치환 |
| Vercel (production / preview / development) | 동일 2개 키 | 기존 값 제거 후 재등록 |

`SUPABASE_SERVICE_ROLE_KEY`는 CLAUDE.md 금지 정책에 따라 신설하지 않는다.

## 5. 라우트 커버리지 설계

PRD §7.2 사이트맵 41개 라우트를 기준선으로 삼고, 저장소의 `app/**/page.tsx`와 1:1 대조한다. 누락 라우트는 Act 단계에서 다음 원칙으로 구현한다.

- 서버 컴포넌트 기본, `'use client'`는 인터랙션 필요 시만
- 가드는 `lib/db/auth.ts`의 `requireAdmin()` 등을 **페이지에서 직접 호출** (middleware는 세션 갱신 전용)
- 기존 `app/admin/*` 화면의 레이아웃·토큰을 그대로 재사용 (신규 디자인 도입 금지)

## 6. 배포 설계

- 배포 위치: **저장소 루트** (`vercel-deploy-from-repo-root` 규칙)
- 대상 프로젝트: `prj_YHUfkb9n2MCnAOQqvizvlOUQoyf9` (ai4ceo-portal)
- 도메인: `ai4ceo.app`, `www.ai4ceo.app` (이미 연결됨)
- 배포 전 조건: build + typecheck 통과, env 교체 완료

## 7. 검증 계획 (Test Plan)

| 레벨 | 항목 | 방법 |
|---|---|---|
| L0 | 스키마 존재·RLS | `list_tables`, `get_advisors(security)` |
| L1 | 빌드·타입 | `npm run build`, `npx tsc --noEmit` |
| L2 | 라우트 커버리지 | PRD 사이트맵 vs `app/**/page.tsx` 대조 |
| L3 | 프로덕션 스모크 | ai4ceo.app 주요 공개 라우트 HTTP 200 |

## 8. Implementation Guide

| Module | 내용 | 산출물 |
|---|---|---|
| module-1 | 마이그레이션 27건 순차 적용 | 원격 DB 스키마 |
| module-2 | env 교체 (로컬 + Vercel) | `.env.local`, Vercel env |
| module-3 | 빌드·타입체크 | 통과 로그 |
| module-4 | 라우트 갭 보완 | 누락 `page.tsx` |
| module-5 | 프로덕션 배포·스모크 | 배포 URL |
