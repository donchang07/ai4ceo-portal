# prd-v30-remaining Completion Report

- **Date**: 2026-07-21 · **Feature**: PRD v3.0 백로그 6개 화면 (SCR-01·03·05·07·08·09)
- **Chain**: PRD(docs/class/prd v.3.0.md) → Plan → Design → Do → Check(97%) → Act(본 보고서)
- **선행 사이클**: prd-v283-core (SCR-02·04·06 — 완료). **본 사이클로 PRD v3.0의 11개 화면 변경([U] 8 + [N] 3)이 전부 구현됨.**

## Executive Summary

| Perspective | Delivered |
|---|---|
| **Problem** | 지원 전 확신 부재(US-01·02) · 결제 실무 병목(US-04) · ROI 증명 수단 부재(US-06) · 결석→이탈(US-08) · 로드맵 KPI 실행수단 부재(US-09) · 수료 후 단절(US-10) |
| **Solution** | /program 자가진단·Build 미리보기·비교 + billing 위임(rpc) + /portal/builds 적용 추적 + 세션 따라잡기 체크리스트 + /portal/roadmap(발표 모드) + /alumni/archive(멤버십 RLS) |
| **Function/UX Effect** | 신규 라우트 3(/portal/builds·/portal/roadmap·/alumni/archive) + 수정 3(/program·/portal/billing·sessions/[id]) + 포탈 nav 2항목 추가 |
| **Core Value** | Check 97% (Critical/Important 0건), build+tsc 통과, RLS 동반 마이그레이션 적용 완료 |

## Key Decisions & Outcomes

| Decision | 근거 | 결과 |
|---|---|---|
| Build 공개 동의 = 기존 `visibility='public'` 재사용 (Plan D-1) | 동일 의미 컬럼 중복 방지, 기존 builds_read 정책 활용 | /program 미리보기가 추가 정책 없이 동작 |
| 위임 저장을 security definer rpc로 (Check C1) | enrollments UPDATE 개방 시 학생이 status 조작 가능 | 보안 구멍 없이 1컬럼만 갱신, email 형식 서버 검증 |
| 따라잡기는 지난 세션 전체 노출 (Plan D-3) | 출석 테이블 부재 | 출석 모듈 도입 시 결석자 한정으로 강화(백로그) |
| 아카이브 RLS = has_active_membership() helper | v2.4 확정 정책(멤버십=전 기수 read-only)의 최소 구현 | videos/materials 정책 확장, 신규 함수 anon 차단 |
| roadmaps 4단계 고정 컬럼 (Plan D-4) | 템플릿 구조 고정 — jsonb보다 계약 명확 | upsert(user_id unique) 단순 계약 |

## Success Criteria Final Status

| SC | Status | Evidence |
|---|:--:|---|
| SC-1 라우트 3신규+3수정 빌드·tsc 통과 | ✅ | next build 라우트 테이블 · tsc exit 0 |
| SC-2 마이그레이션 1개(테이블 2·컬럼 3·함수 2·정책 확장 5) | ✅ | 20260721100000_prd_v30_remaining.sql |
| SC-3 Gap ≥90% | ✅ | 97% (docs/03-analysis/prd-v30-remaining.analysis.md) |
| SC-4 Supabase 적용 + push + Vercel | ✅ | apply_migration 성공(prd_v30_remaining · prd_v30_revoke_anon_fns) · 배포는 push 후 Vercel 자동 |

**Success Rate: 4/4**

## Check에서 잡은 버그

- **C1 (Critical→해소)**: 위임 저장이 enrollments RLS(admin 전용 UPDATE)에 막히는 결함. 일반 UPDATE 정책 개방은 학생의 enrollment.status 조작 통로가 되므로, `set_billing_delegate` security definer 함수(소유 검증+형식 검증+단일 컬럼)로 해소.

## Backlog (다음 사이클)

- 따라잡기: 출석 모듈 도입 후 결석자 한정 노출 + 시청률 임계값 판정 (PRD 오픈 이슈)
- 로드맵: PDF 내보내기 · 발표 모드 목차 네비 · assistant 열람 권한
- /program 자가진단 결과를 `application.submitted` 이벤트 속성으로 계측 연결
- admin 짝 화면: builds 적용 현황 집계·roadmap 제출 현황 (E-9 90일 성과설문 연계)
- prd v.2.8.1·v.2.8.2 원문 대조 (로컬 PC에만 존재 — push 후 확인)
