# prd-v30-remaining Plan (PDCA Plan)

- **Date**: 2026-07-21 · **PRD**: [docs/class/prd v.3.0.md](../../class/prd%20v.3.0.md)
- **선행 사이클**: prd-v283-core (F1 /apply/status · F2 AI 에스컬레이션 · F3 /portal/tasks — Check 100% 완료)
- **본 사이클**: v3.0 백로그 6개 화면 전부 (SCR-01·03·05·07·08·09)
- **디자인 기준**: `PRD v2.6 화면 설계/design_handoff_ai4ceo_portal` (README 디자인 토큰 — 앱에 이미 Tailwind 토큰으로 반영되어 있음: bg-canvas/surface/hairline/primary 등. 신규 화면도 기존 컴포넌트(`components/ui.tsx`)와 shell 패턴 재사용으로 디자인 정합 유지)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 지원 전 확신 부재(US-01·02) · 결제 실무 병목(US-04) · ROI 증명 수단 부재(US-06) · 결석→이탈(US-08) · 로드맵 KPI 실행수단 부재(US-09) · 수료 후 단절(US-10) |
| **WHO** | 비로그인 방문자 · 합격 CEO · 수강생 · assistant · 동문(멤버십) |
| **RISK** | RLS 없이 배포 금지(신규 테이블 2) · videos/materials가 재학생 전용이라 동문 아카이브가 RLS에 막힘 · builds 모듈 기존 화면 없음 |
| **SUCCESS** | build+tsc 통과 · Check ≥90% · 마이그레이션 Supabase 적용 · push+Vercel 배포 |
| **SCOPE** | 아래 F1~F6. admin 화면 보강·알림톡 연동은 범위 외(기존 백로그 유지) |

## Features

| # | 화면 | 유형 | 내용 |
|---|---|---|---|
| F1 | SCR-01 /program | [U] | ① 5문항 자가진단(클라이언트, 비저장) ② 수료생 Build 미리보기(공개분 최대 3건) ③ 경쟁 비교 3축 섹션 |
| F2 | SCR-03 /portal/billing | [U] | 결제 실무 위임: enrollments.billing_delegate_email + invoices/tax_invoices RLS 확장 + 위임 패널 UI |
| F3 | SCR-05 /portal/builds | [N] | 내 결과물 목록·등록·편집 + 적용 추적(apply_status/effect_memo) + 공개 동의 토글. 포탈 nav 추가 |
| F4 | SCR-07 /portal/sessions/[id] | [U] | 지난 세션 따라잡기 체크리스트 4단계(영상→자료→과제→AI 조교) + session_catchups 저장 |
| F5 | SCR-08 /portal/roadmap | [N] | AX 로드맵 4단계 템플릿 작성 + Build 연결 + 발표 모드. 포탈 nav 추가 |
| F6 | SCR-09 /alumni/archive | [N] | 멤버십 전용 전 기수 아카이브(기수→세션→영상·자료) + RLS 동문 확장 |

## 사전 결정 (질문 없이 진행 — 근거 포함)

| # | 결정 | 근거 |
|---|---|---|
| D-1 | Build 공개 동의는 신규 `public_consent` 컬럼 대신 기존 `builds.visibility='public'` 재사용 | 스키마에 visibility(cohort/public)와 `builds_read` RLS(public 공개 열람)가 이미 존재. 동일 의미 중복 컬럼 방지 |
| D-2 | 결제 위임은 enrollments에 `billing_delegate_email` 1컬럼 + JWT email 매칭 RLS | 선행 사이클의 delegated_tasks.assistant_email 패턴 재사용(링크 테이블 부재 환경에서 검증된 방식) |
| D-3 | 따라잡기 체크리스트는 출석 데이터 부재로 "지난 세션 전체"에 노출 | 출석 테이블이 없음. PRD의 "결석자 자동 노출"은 출석 모듈 도입 후 조건 강화(백로그) |
| D-4 | 로드맵은 `roadmaps` 1테이블 + sections jsonb(4단계 고정 키) | 단계 스키마 고정(진단/과제/90일/확산)이므로 정규화 불필요. 초안/발표본은 status 컬럼 |
| D-5 | 아카이브 RLS는 `has_active_membership()` helper + sessions/videos/materials read 정책에 OR 추가 | v2.4 확정 정책(멤버십 = 과거 전 기수 read-only)의 최소 구현. 앱 게이트(requireArchiveAccess)는 이미 존재 |
| D-6 | PDF 내보내기(SCR-08)·알림톡 연동은 미구현 | PRD 오픈 이슈(확인 필요) 항목 — 운영자 결정 대기 |

## Success Criteria

- **SC-1**: 신규 라우트 3(/portal/builds·/portal/roadmap·/alumni/archive) + 수정 3(/program·/portal/billing·sessions/[id])이 next build 라우트 테이블에 나타나고 tsc 통과
- **SC-2**: 마이그레이션 1파일 — 신규 테이블 2(session_catchups·roadmaps) + builds 컬럼 2 + enrollments 컬럼 1 + RLS(신규 테이블 전체, invoices/tax_invoices/sessions/videos/materials 확장)
- **SC-3**: Check 갭 분석 ≥90% (미만 시 수정 후 재분석)
- **SC-4**: Supabase 마이그레이션 적용 + GitHub push + Vercel 배포
