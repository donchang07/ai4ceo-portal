# prd-v283-core Gap Analysis (PDCA Check)

- **Date**: 2026-07-20 · **Method**: Static only (테스트 인프라 없음) · Formula: Structural×0.2 + Functional×0.4 + Contract×0.4
- **Design**: [prd-v283-core.design.md](../02-design/features/prd-v283-core.design.md)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 지원 상태 불투명·AI 막힘 방치·위임 수단 부재 |
| **WHO** | 지원자(비로그인) · 수강생 CEO · assistant · admin |
| **RISK** | applications admin 전용 SELECT — security definer 함수 최소 반환 |
| **SUCCESS** | build+tsc 통과, 3개 화면, RLS 동반 배포, Vercel 반영 |
| **SCOPE** | F1 /apply/status · F2 에스컬레이션+/admin/ai · F3 /portal/tasks |

## Overall: 100% ✅

| Axis | Weight | Score |
|------|:------:|:-----:|
| Structural | 0.2 | 100% |
| Functional | 0.4 | 100% |
| Contract | 0.4 | 100% |
| **Overall** | — | **100%** |

SC-3(≥90%) 충족. Critical/Important 0건 — iterate 불필요.

## Axis Detail

- **Structural 100%**: Design §5.1의 8개 파일 전부 실구현 존재 (스텁 없음).
- **Functional 100%**: §5.4 체크리스트 20개 항목 전부 구현 — /apply/status 7/7, /portal/ai 에스컬레이션 4/4, /portal/tasks 6/6, /admin/ai 3/3.
- **Contract 100%**: delegated_tasks 8컬럼+CHECK+RLS 4정책 일치, 함수 시그니처·security definer·search_path·grant 일치, 클라이언트 호출(rpc명·파라미터·insert 필드) 일치, ai_question_logs insert는 기존 `ailogs_ins` 정책 내 동작.

## Gaps

Critical: 없음 · Important: 없음

| # | Minor | 조치 |
|---|---|---|
| M1 | 마이그레이션의 인덱스 2개가 Design §3.1에 없음 | Design에 반영 완료 |
| M2 | `revoke all from public`이 Design SQL에 없음 | Design에 반영 완료 |
| M3 | 에스컬레이션 실패 시 사용자 피드백 없음(버튼 유지로 재시도 여지만 확보) | 백로그 (toast) |
| M4 | 기존 비기능 Chip(공유·코칭·신고)은 이전부터 목업 | 본 사이클 범위 밖 |

## FR Verification

| FR | Status | Evidence |
|----|:------:|----------|
| FR-01 email+phone 조회 | ✅ | status-view.tsx:51-74 |
| FR-02 security definer 3필드 | ✅ | migration:53-71 |
| FR-03 escalated 로그+안내 | ✅ | ai-tutor-view.tsx:89-111,194-202 |
| FR-04 /admin/ai admin 전용 | ✅ | admin/ai/page.tsx:17-34 |
| FR-05 CEO 생성+양측 상태 변경 | ✅ | tasks-view.tsx:78-121 + RLS |
| FR-06 delegated_tasks RLS | ✅ | migration:25-48 (4정책) |
| FR-07 가드/공개 구분 | ✅ | tasks/page.tsx:6, apply/status/page.tsx:7 |

## Security

RLS 동반 배포 ✅ · definer 최소 반환+revoke+search_path 고정 ✅ · zod 검증 ✅ · service_role 미사용 ✅ · 가드 호출 ✅ (admin은 페이지+layout 이중)

## 검증 게이트

- `npx tsc --noEmit` 통과 ✅ · `npm run build` 통과 ✅ (신규 라우트 /apply/status·/portal/tasks·/admin/ai 빌드 확인)
