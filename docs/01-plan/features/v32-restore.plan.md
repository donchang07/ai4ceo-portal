# ai4ceo-portal-v3.2-restore Planning Document

> **Summary**: PRD v3.2 기준으로 소실된 Supabase 백엔드를 신규 프로젝트에 재구축하고, 기존 소스코드를 검증한 뒤 ai4ceo.app 프로덕션으로 배포한다.
>
> **Project**: ai4ceo (ai4ceo-portal)
> **Version**: 0.1.0 / release/v3.2.1
> **Author**: 장동인 교수 (donchang07)
> **Date**: 2026-09-04
> **Status**: Approved (무질문 자동 진행 모드)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Supabase 프로젝트가 삭제되어 DB가 완전히 비었고, `.env.local`은 삭제된 구 프로젝트(`olofwxsavfthsmmwjwzk`)를 가리켜 ai4ceo.app이 전면 장애 상태다. |
| **Solution** | 신규 Supabase 프로젝트(`qkhmpejlktjwhbeksane`)에 저장소의 마이그레이션 27개를 순서대로 재적용하고, 환경변수를 로컬·Vercel 양쪽에서 교체한 뒤, PRD v3.2 사이트맵 대비 갭을 메우고 프로덕션 배포한다. |
| **Function/UX Effect** | 41개 PRD 라우트 전체가 실 데이터로 동작하는 상태 복구. 로그인·지원·결제·LMS·동문 전 구간 재가동. |
| **Core Value** | "소스는 있으나 DB가 없어 죽은 포탈"을 PRD v3.2 규격의 살아있는 서비스로 되돌린다. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Supabase 프로젝트 삭제로 ai4ceo.app 전면 장애 |
| **WHO** | 18기 수강생 CEO·동반 임직원·동문·운영 관리자 |
| **RISK** | 마이그레이션 순서 의존성 파손, RLS 정책 누락으로 데이터 노출, env 교체 누락으로 배포 후에도 장애 지속 |
| **SUCCESS** | Gap 95% 이상 · `npm run build` + `tsc --noEmit` 통과 · Supabase security advisor 0 critical · ai4ceo.app 프로덕션 200 응답 |
| **SCOPE** | Do1 DB 재구축 → Do2 env 교체 → Do3 빌드 검증 → Check 갭분석(≥95%) → Act 갭 보완 → QA 스모크 → Deploy |

---

## 1. Overview

### 1.1 Purpose

PRD v3.2가 정의한 41개 화면과 데이터 모델을 실제로 동작하는 상태로 복구한다.

### 1.2 Background

2026-09-03 신규 Supabase 프로젝트가 생성되었으나 `public` 스키마에 테이블이 0개다. 애플리케이션 소스(50 페이지 / 9 API 라우트 / 마이그레이션 27개)는 온전하다. 따라서 신규 개발이 아니라 **백엔드 재구축 + 갭 보완 + 배포**가 과제다.

### 1.3 Related Documents

- 요구사항: `docs/prd/prd-v3.2.md` (§6.3 데이터 모델, §7.2 사이트맵)
- 디자인 토큰: `docs/DESIGN.md`, `docs/brandvoice.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] 마이그레이션 27개를 신규 Supabase 프로젝트에 순서대로 적용 (pgcrypto·vector 확장 포함)
- [ ] `.env.local` 및 Vercel 환경변수의 Supabase URL/ANON KEY 교체
- [ ] `npm run build` · `npx tsc --noEmit` 통과 검증
- [ ] PRD §7.2 사이트맵 41개 라우트 대비 갭 분석 및 미구현 화면 보완
- [ ] Supabase security advisor 기준 RLS 누락 0건
- [ ] ai4ceo.app 프로덕션 배포 및 스모크 테스트

### 2.2 Out of Scope

- 신규 기능 추가 (PRD v3.2에 없는 것)
- Toss Payments 라이브 키 전환 (심사 진행 중, 테스트 키 유지)
- 카카오 알림톡 템플릿 신규 검수 신청
- 구 프로젝트 데이터 복구 (원본 소실)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 신규 Supabase 프로젝트에 전체 스키마·RLS·RPC 재구축 | High | Pending |
| FR-02 | 18기 시드 데이터(커리큘럼 v18, 10주 세션) 재적재 | High | Pending |
| FR-03 | 로컬/Vercel 환경변수를 신규 프로젝트로 교체 | High | Pending |
| FR-04 | PRD §7.2 사이트맵 41개 라우트 100% 존재 | High | Pending |
| FR-05 | 빌드·타입체크 무오류 | High | Pending |
| FR-06 | ai4ceo.app 프로덕션 배포 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Security | 모든 public 테이블 RLS 활성 + 정책 존재 | Supabase security advisor |
| Correctness | `any` 0건, `console.log` 0건 | grep |
| Build | `next build` 성공, `tsc --noEmit` 0 error | CI 명령 |
| Availability | ai4ceo.app / www.ai4ceo.app 200 | HTTP 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] SC-1: 마이그레이션 27개 전부 적용, `list_migrations` 27행
- [ ] SC-2: `public` 스키마 테이블 수 > 0이며 전부 RLS 활성
- [ ] SC-3: PRD 사이트맵 라우트 매칭률 ≥ 95%
- [ ] SC-4: `npm run build` + `npx tsc --noEmit` 통과
- [ ] SC-5: Supabase security advisor ERROR 0건
- [ ] SC-6: ai4ceo.app 프로덕션 배포 READY

### 4.2 Quality Criteria

- [ ] Zero build errors
- [ ] Zero TypeScript errors
- [ ] Zero RLS-missing advisories

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 마이그레이션 순서 의존성 파손 | High | Medium | 파일명 타임스탬프 순 1건씩 개별 적용, 실패 시 즉시 중단·원인 수정 |
| `vector` 확장 미설치로 RAG 마이그레이션 실패 | Medium | Medium | `create extension if not exists vector` 선행 확인 |
| env 교체 누락으로 배포 후 장애 지속 | High | Medium | 로컬 `.env.local` + Vercel 3개 환경(prod/preview/dev) 모두 교체 후 배포 로그 확인 |
| service_role 키 부재로 일부 관리 기능 제약 | Medium | High | CLAUDE.md 정책상 service_role 클라이언트 신설 금지 — 기존 anon+RLS 경로 유지 |
| 시드 admin 프로필이 auth.users 부재로 미삽입 | Medium | High | 관리자 계정 최초 로그인 시 `ADMIN_EMAIL` 부트스트랩 폴백으로 승격 (기존 `lib/db/auth.ts` 경로) |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| Supabase project ref | Config | `olofwxsavfthsmmwjwzk` → `qkhmpejlktjwhbeksane` |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Env | 신규 프로젝트 값으로 교체 (로컬 + Vercel) |
| `public` 스키마 전체 | DB Schema | 0개 → 마이그레이션 27개분 재구축 |
| `app/admin/*` | Route | 갭 분석 결과에 따라 미구현 화면 추가 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| Supabase URL/KEY | READ | `lib/db/supabase-server.ts`, `lib/db/supabase-client.ts`, `middleware.ts` | 값만 교체, 코드 변경 없음 |
| `public` 테이블 | CRUD | 50 페이지 / 9 API 라우트 전역 | 스키마 동일 재구축이므로 무영향 |
| RLS 정책 | READ | `is_admin()` / `is_enrolled()` 기반 전 화면 | 재적용 필수 |

### 6.3 Verification

- [ ] 마이그레이션 적용 후 `list_tables`로 테이블 존재 확인
- [ ] security advisor로 RLS 누락 확인
- [ ] 빌드·타입체크로 코드 측 회귀 확인

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| Starter | ☐ |
| **Dynamic** | ☑ |
| Enterprise | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Framework | Next.js 15 App Router | 기존 구조 유지 |
| Backend | Supabase (`@supabase/ssr`) | CLAUDE.md 규약 |
| DB 재구축 방식 | 기존 마이그레이션 27개 순차 재적용 | 스키마 재작성 대비 회귀 위험 최소 |
| 배포 | Vercel (저장소 루트에서) | `vercel-deploy-from-repo-root` 메모리 규칙 |
| service_role | 도입 안 함 | CLAUDE.md 금지 사항 |

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] `CLAUDE.md` 코딩 규약 존재
- [x] `tsconfig.json` strict
- [ ] ESLint 미구성 (검증 근거로 사용 금지)

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | 교체 필요 |
|----------|---------|-------|:---------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API endpoint | Client | ☑ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | Client | ☑ |
| `ANTHROPIC_API_KEY` | AI 튜터 | Server | ☐ |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` | 결제 (테스트 키) | Both | ☐ |
| `ADMIN_DEVICE_GUARD` | 관리자 기기 잠금 | Server | ☐ |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`v32-restore.design.md`)
2. [ ] Do: DB 재구축 → env 교체 → 빌드 검증
3. [ ] Check: 갭 분석 ≥95%

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-09-04 | 초안 (무질문 자동 진행) | 장동인 교수 |
