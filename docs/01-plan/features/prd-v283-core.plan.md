# prd-v283-core Planning Document

> **Summary**: PRD v2.8.3의 P0 2건 + P1 1건(신규 테이블 포함)을 하나의 사이클로 구현
>
> **Project**: ai4ceo-portal (apps/ai4ceo)
> **Author**: 장동인교수 + Claude Code
> **Date**: 2026-07-20
> **Status**: Approved (사용자 위임 — 추천안 자동 채택)
> **PRD**: docs/class/prd v.2.8.3.md

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 지원자는 전형 상태를 알 수 없고(US-03), 수강생은 AI 조교로 해결 안 되는 막힘을 사람에게 이어갈 수 없으며(US-05), CEO는 실무를 위임할 도구가 없다(US-07). |
| **Solution** | ① /apply/status 공개 조회(보안 함수 기반) ② AI 조교 에스컬레이션 + /admin/ai 검수 큐 ③ /portal/tasks 위임 할 일 + delegated_tasks 테이블 |
| **Function/UX Effect** | 지원 퍼널 이탈 감소, AI 미해결 질문의 24h 내 인적 후속, CEO-assistant 협업 실체화 |
| **Core Value** | PRD v2.8.3 P0 전부 + 마이그레이션 수반 P1 1건을 프로덕션 배포까지 완결 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 지원 상태 불투명·AI 막힘 방치·위임 수단 부재가 각각 모집 퍼널·완주율·동반자 모델을 깨뜨림 |
| **WHO** | 지원자(비로그인) · 수강생 CEO(enrolled+) · 동반 assistant · admin |
| **RISK** | applications는 admin 전용 SELECT — 공개 조회는 security definer 함수로만, 개인정보 최소 반환 |
| **SUCCESS** | build+tsc 통과, 3개 화면 동작, 신규 테이블 RLS 동반 배포, Vercel 프로덕션 반영 |
| **SCOPE** | F1 /apply/status · F2 AI 에스컬레이션+/admin/ai · F3 /portal/tasks+delegated_tasks |

---

## 1. Overview

- **Purpose**: PRD v2.8.3(docs/class/prd v.2.8.3.md)의 우선순위 상위 3개 기능을 PDCA 1사이클로 구현·배포.
- **Background**: Day2 시장조사(P1~P5)에서 도출된 유저 스토리 US-03·05·07 대응. 나머지 8개 화면(U-1 /program 자가진단, U-3 billing 위임, U-5 builds, U-6 sessions 따라잡기, /portal/roadmap, /alumni/archive 등)은 다음 사이클 백로그.
- **Related**: prd v.2.8.3.md · diff3.md · CLAUDE.md(RLS 필수, service_role 금지)

## 2. Scope

### 2.1 In Scope
- [ ] F1: `/apply/status` — 이메일+전화 기반 지원 상태 조회 (P0, US-03)
- [ ] F2: `/portal/ai` 에스컬레이션 버튼 + `ai_question_logs` status='escalated' 기록 + `/admin/ai` 검수 큐 (P0, US-05)
- [ ] F3: `/portal/tasks` 위임 할 일 CRUD + `delegated_tasks` 테이블·RLS (P1, US-07)
- [ ] 마이그레이션 1개 파일 + Supabase 적용 + GitHub push + Vercel 배포

### 2.2 Out of Scope
- /program 자가진단·비교 섹션, /portal/billing 위임, /portal/builds 적용 추적, sessions 따라잡기, /portal/roadmap, /alumni/archive (백로그)
- 알림톡 연동, 코칭/보충 예약 화면(/portal/coaching·/portal/supplement — 미존재, 에스컬레이션 안내 카드로 대체)

## 3. Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 비로그인 지원자가 이메일+전화번호로 본인 지원 상태(접수/심사중/합격/불합격/대기) 조회 | High | Pending |
| FR-02 | 조회는 security definer 함수로만 — status·기수·접수일만 반환, 타인 정보 노출 불가 | High | Pending |
| FR-03 | AI 조교 답변 후 "해결 안 됨" 클릭 시 escalated 로그 기록 + 후속 안내(코칭·보충·교수 검수) 표시 | High | Pending |
| FR-04 | /admin/ai 에서 escalated 질문 목록(질문·답변·사용자·일시) admin 전용 열람 | High | Pending |
| FR-05 | CEO가 할 일 생성 시 assistant 이메일 지정, 양측 모두 조회·상태 변경(대기/진행/완료) 가능 | High | Pending |
| FR-06 | delegated_tasks RLS: CEO 본인·지정 assistant(JWT email)·admin만 접근 | High | Pending |
| FR-07 | /portal/tasks 는 requireLmsAccess 가드, /apply/status 는 공개 | High | Pending |

### 3.2 Non-Functional
| Category | Criteria | Measurement |
|----------|----------|-------------|
| 품질 게이트 | `npm run build` + `npx tsc --noEmit` 통과, `any` 0건 | CI 수동 실행 |
| 보안 | 신규 테이블 RLS 동반 배포, service_role 미사용, 입력 zod 검증 | 마이그레이션 리뷰 |
| 컨벤션 | 서버 page + 클라이언트 view 분리, ui.tsx 프리미티브 재사용 | 코드 리뷰 |

## 4. Success Criteria

- [ ] SC-1: 3개 라우트(/apply/status, /portal/tasks, /admin/ai) 신설 + /portal/ai 수정이 빌드 통과
- [ ] SC-2: 마이그레이션 1개(`20260720…_prd_v283_core.sql`)에 테이블·RLS·함수 포함, Supabase 적용 성공
- [ ] SC-3: Gap 분석(Match Rate) ≥ 90%
- [ ] SC-4: GitHub push + Vercel 프로덕션 배포 완료

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 공개 조회 함수의 개인정보 노출 | High | Low | email+phone 완전 일치 시에만 status 3필드 반환, 함수 반환 컬럼 최소화 |
| assistant 링크 테이블 부재 | Medium | High | assistant_email 컬럼 + `auth.jwt()->>'email'` RLS로 링크 테이블 없이 해결 |
| Supabase 원격 적용 실패(CLI 미구성) | Medium | Medium | Supabase MCP `apply_migration` 사용 |
| Vercel 배포 실패 | Medium | Low | git push 자동 배포 + MCP로 배포 상태 확인 |

## 6. Impact Analysis

| Resource | Type | Change |
|----------|------|--------|
| `ai_question_logs` | DB | 행 추가 방식만 사용(status='escalated' 신규 insert) — 스키마 무변경 |
| `applications` | DB | 무변경 — 조회 함수만 추가 |
| `delegated_tasks` | DB | 신규 테이블 |
| `app/portal/ai/ai-tutor-view.tsx` | UI | 에스컬레이션 UI 추가 (기존 채팅 흐름 무변경) |
| `components/portal-shell.tsx` | UI | nav에 "할 일" 항목 추가 |

기존 소비자 영향: `ai_question_logs`는 insert 전용 추가라 admin 로그 화면(현재 미존재)·기존 로깅에 영향 없음. applications 소비자(apply 폼, admin/applications)는 무변경.

## 7. Architecture Considerations

- Level: **Dynamic** (기존 앱 구조 그대로 — Next.js 15 App Router + Supabase)
- 결정: 상태관리 없음(서버 컴포넌트+최소 클라이언트), API는 Supabase 직접(RLS)+RPC, 폼은 native+zod, 스타일 Tailwind 토큰, 테스트는 build+tsc+수동(기존 프로젝트에 테스트 인프라 없음 — CLAUDE.md 검증 기준 준수)

## 8. Convention Prerequisites

- CLAUDE.md 컨벤션 존재(확인): npm only, `any` 금지, 서버 팩토리 `lib/db/supabase-server.ts`, 브라우저 `lib/db/supabase-client.ts`, 가드 직접 호출, zod 사용
- 신규 env 불필요

## 9. Next Steps

1. [x] Plan 승인 (자동 — 사용자 위임)
2. [ ] Design 문서 → 구현 → Gap 분석 → 배포
