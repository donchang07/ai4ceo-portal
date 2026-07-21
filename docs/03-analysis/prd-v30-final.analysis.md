# prd-v30-final Gap Analysis (PDCA Check)

- **Date**: 2026-07-21 · **Method**: Static only (테스트 인프라 없음) · Formula: Structural×0.2 + Functional×0.4 + Contract×0.4
- **Design**: [prd-v30-final.design.md](../02-design/features/prd-v30-final.design.md)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | US-01·02(지원 전 확신) 미해결, US-10(아카이브 녹화본·교재) 미해결, T-01~03 알림톡 트리거 부재 |
| **WHO** | 비로그인 방문자 · 지원자 · 멤버십 동문 |
| **RISK** | 카카오 알림톡 실채널 미가입 — no-op 유지가 의도된 설계(D-3) |
| **SUCCESS** | build+tsc 통과, Check ≥90%, main 직접 반영 |
| **SCOPE** | F1 /program 자가진단·미리보기·비교 · F2 /alumni/archive 녹화본·교재 · F3 T-01/02/03 트리거 배선 |

## Overall: 96% ✅ (기준 ≥90)

| Axis | Weight | Score |
|------|:------:|:-----:|
| Structural | 0.2 | 100% |
| Functional | 0.4 | 95% |
| Contract | 0.4 | 95% |
| **Overall** | — | **96%** |

## Axis Detail

- **Structural 100%**: Design §1의 6개 파일(수정 5·신규 2) 전부 실구현. next build 통과, tsc 0 에러.
- **Functional 95%**: F1 자가진단 5문항·결과 3구간·CTA(§2) 전부 구현, Build 미리보기·비교 표 구현. F2 실제 기수 필터·세션별 영상/자료·멤버십 잠금·진행 중 기수 잠금 전부 구현. F3 T-01(지원 접수 시)·T-02(합격)·T-03(불합격/대기) 3개 전부 배선. 0.05 감점: F1 자가진단 결과가 이벤트로 계측되지 않음(퍼널 추적 미연결, 백로그).
- **Contract 95%**: `notify()` 시그니처 무변경으로 호출부만 추가 — 계약 위반 없음. `submitApplication` 서버 액션이 기존 client insert를 대체하면서 `applications_insert`(public insert) RLS 경로 그대로 사용 — 정책 변경 없음. 0.05 감점: T-02/T-03 발송 후 실패 시(문자 발송 실패 등) UI에 별도 알림이 없음(로그만 남음 — 기존 notify() no-op 설계와 일관되지만 운영 관점에서는 백로그).

## Check 중 확인한 결함

없음(Critical/Important 0건). Minor 2건은 아래 표.

| # | Minor | 내용 · 처리 |
|---|---|---|
| M1 | 자가진단 결과 계측 미연결 | 5문항 결과가 `application.submitted` 이벤트 속성으로 이어지지 않음 — v1.1 검증 계획 4번 항목과 연결 필요(백로그) |
| M2 | 알림톡 발송 실패 UX 부재 | notify() 실패 시 admin 화면에 표시 없음 — `notifications` 테이블 status='failed' 조회 뷰 필요(백로그, 알림톡 실채널 연동과 함께) |
| M3 | `/apply` 라우트가 서버 액션 사용으로 전환되며 기존 client-only insert 제거 | 의도된 변경(D-4) — applications_insert RLS(public insert)로 정책 변경 없이 동일 동작 |

## 판정

SC-1~5 전부 충족. Critical/Important 0건 — **iterate 불필요, Act 진행**.
