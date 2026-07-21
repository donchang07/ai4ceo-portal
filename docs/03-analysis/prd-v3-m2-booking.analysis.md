# prd-v3-m2-booking Gap Analysis (PDCA Check)

- **Date**: 2026-07-21 · **Method**: Static only (테스트 인프라 없음) · Formula: Structural×0.2 + Functional×0.4 + Contract×0.4
- **Design**: [prd-v3-m2-booking.design.md](../02-design/features/prd-v3-m2-booking.design.md)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | D-12(1:1 코칭 예약)·D-13(오프라인 보충수업 신청) 수단 부재 — 둘 다 P0, 완주율 직결 |
| **WHO** | 재학생(enrolled/in_training) · admin |
| **RISK** | 정원 초과는 하드 제약 없이 UI 표시만(Plan D-3, 의도된 결정) |
| **SUCCESS** | build+tsc 통과, Check ≥90% |
| **SCOPE** | `/portal/coaching`, `/portal/supplement`, `session_bookings` 테이블 |

## Overall: 95% ✅ (기준 ≥90)

| Axis | Weight | Score |
|------|:------:|:-----:|
| Structural | 0.2 | 100% |
| Functional | 0.4 | 93% |
| Contract | 0.4 | 95% |
| **Overall** | — | **95%** |

## Axis Detail

- **Structural 100%**: Design §2의 7개 파일(신규 6·수정 1) 전부 실구현. next build 라우트 테이블에 `/portal/coaching`·`/portal/supplement` 노출, tsc 0 에러.
- **Functional 93%**: D-12(슬롯 목록·예약·취소·정원 표시·빈 상태) 5/5, D-13(안내 문구·신청·취소·정원·빈 상태) 5/5. 0.07 감점: H-7(admin 신청자 목록 관리 화면)은 Plan에서 명시적으로 스코프 제외 — 데이터는 RLS상 admin이 전체 조회 가능하지만 전용 UI 없음(백로그, 의도된 축소).
- **Contract 95%**: `session_bookings` upsert(`onConflict: session_id,user_id`) 계약이 RLS(self+admin)와 일치. `bookSession`/`cancelBooking` 서버 액션이 두 화면에서 공유되며 templateCode만 분기 — 설계와 일치. 0.05 감점: `notify()`의 `to` 필드에 코칭/보충 알림톡 발송 시 전화번호 대신 이메일을 전달(CurrentUser에 phone 필드 없음) — alimtalk 채널이 현재 no-op이라 기능 영향은 없으나, 실채널 연동 시 phone 조회 경로 추가 필요(백로그로 명시).

## Check 중 확인한 결함

없음(Critical/Important 0건).

| # | Minor | 내용 · 처리 |
|---|---|---|
| M1 | admin용 신청자 목록 UI 부재 | Plan D-5로 이미 스코프 제외 — 데이터는 확보됨(RLS admin 전체 조회 가능), 백로그 |
| M2 | notify() `to`에 phone 대신 email 전달 | CurrentUser에 phone 필드 부재. 알림톡 실채널 연동 시 profiles/enrollments에서 phone 조회 경로 추가 필요(백로그) |

## 판정

SC-1~4 충족. Critical/Important 0건 — **iterate 불필요, Act 진행**.
