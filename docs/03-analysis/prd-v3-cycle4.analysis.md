# prd-v3-cycle4 Gap Analysis (PDCA Check)

- **Date**: 2026-07-21 · **Method**: Static only · Formula: Structural×0.2 + Functional×0.4 + Contract×0.4
- **Design**: [prd-v3-cycle4.design.md](../02-design/features/prd-v3-cycle4.design.md)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 슬롯(코칭/보충) 생성 UI 부재(cycle2 잔여 갭), 기수 현황·Version Pack 잠금 상태를 볼 화면 부재 |
| **WHO** | admin 전용 |
| **RISK** | 기존 admin 3개 화면의 가드 부재는 이번 스코프 아님(선행 백로그 유지) |
| **SUCCESS** | build+tsc 통과, Check ≥90% |
| **SCOPE** | `/admin/cohorts`, `/admin/bookings`, `/admin/version-packs` |

## Overall: 96% ✅ (기준 ≥90)

| Axis | Weight | Score |
|------|:------:|:-----:|
| Structural | 0.2 | 100% |
| Functional | 0.4 | 95% |
| Contract | 0.4 | 95% |
| **Overall** | — | **96%** |

## Axis Detail

- **Structural 100%**: Design §2의 10개 파일(신규 9·수정 1) 전부 실구현. 3개 신규 라우트 모두 next build 노출, tsc 0 에러.
- **Functional 95%**: F1(기수 목록·등록 인원 집계) 완전 구현. F2(슬롯 생성 폼 + 신청자 목록 + 참석 3단 토글) 완전 구현 — cycle2에서 남겨둔 "admin이 슬롯을 만들 방법 없음" 갭을 해소. F3(목록·잠금/해제·변경 요약) 구현. 0.05 감점: H-13의 "복제" 로직(Plan D-4로 의도적 제외)은 미구현.
- **Contract 95%**: `createSlot`이 기존 `sessions` 스키마 제약(type enum, cohort_id FK)과 일치. `setAttended`/`toggleLock`이 각 테이블 RLS(admin 전체 접근)와 일치. 신규 3화면 전부 `getCurrentUser()+isAdmin()+redirect` 가드 적용(Design D-1 이행 확인). 0.05 감점: `session_bookings` 조회 시 `profiles(name)` 임베드가 PostgREST FK 추론에 의존 — 스키마 캐시 갱신 지연 시 첫 요청에서 실패할 가능성(런타임에서만 확인 가능, 정적 검토로는 계약 형태만 확인).

## Check 중 확인한 결함

없음(Critical/Important 0건).

| # | Minor | 내용 · 처리 |
|---|---|---|
| M1 | Version Pack "복제" 워크플로 미구현 | Plan D-4로 의도적 제외 — 새 기수 생성+스냅샷 복제는 별도 사이클 규모, 백로그 유지 |
| M2 | 기존 admin 3개 화면(curriculum·billing·applications)의 가드 부재 | 이번 사이클 스코프 아님 — 선행 리포트에 이미 기록된 별도 보안 사이클 대상 |

## 판정

SC-1~5 충족. Critical/Important 0건 — **iterate 불필요, Act 진행**.
