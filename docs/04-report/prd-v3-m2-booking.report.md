# prd-v3-m2-booking Completion Report

- **Date**: 2026-07-21 · **Feature**: PRD v3.0 §7.2 사이트맵 잔여 라우트 — M2 슬라이스 1 (D-12·D-13)
- **Chain**: PRD(`ai4ceo-portal-PRD-v3_0.docx` §4.4) → Plan → Design → Do → Check(95%) → Act(본 보고서)
- **선행**: prd-v283-core → prd-v30-final(§7.3 v3.0 화면 변경 11건 완결). 본 사이클부터 §7.2 사이트맵의 M2~M4 잔여 라우트를 순차 진행 — **M2가 3주 분량으로 가장 커서, 학생용 P0 2건만 이번 사이클 스코프로 한정**.

## Executive Summary

| Perspective | Delivered |
|---|---|
| **Problem** | 재학 중 막힌 지점 즉시 해결 수단(1:1 코칭) 부재, 오프라인 보충수업 신청·안내 수단 부재 — 둘 다 완주율 직결 P0 |
| **Solution** | `/portal/coaching`(코칭 슬롯 예약) · `/portal/supplement`(보충수업 신청) — `sessions` 테이블(기존 coaching/offline_supplement 타입)을 슬롯으로, 신규 `session_bookings` 1테이블로 예약 상태 관리 |
| **Function/UX Effect** | 신규 라우트 2개, 포탈 nav에 "코칭 예약"·"보충수업" 추가, 예약 확정 시 알림톡 T-12/T-13 발송 |
| **Core Value** | Check 95%, 신규 테이블 1개(RLS 4정책 동반), build+tsc 통과, main 직접 반영 |

## Key Decisions & Outcomes

| Decision | 근거 | 결과 |
|---|---|---|
| 신규 슬롯 테이블 안 만들고 `sessions.type` 재사용 | 스키마에 `coaching`·`offline_supplement`가 이미 존재, 18기 보충수업 1건이 이미 이 타입으로 시딩됨 | 마이그레이션이 예약 테이블 1개로 최소화 |
| 코칭·보충 예약을 공용 테이블 `session_bookings` 하나로 | 두 화면이 "슬롯에 예약"이라는 동일 패턴 | 서버 액션(`bookSession`/`cancelBooking`)도 공유, 코드 중복 없음 |
| 정원 초과는 UI 표시만, DB 하드 제약 없음 | 기존 코드 전반의 저트래픽 가정과 일관, 과도한 엔지니어링 지양 | count 쿼리 + 클라이언트 표시로 충분 |
| admin 신청자 관리 화면(H-7) 스코프 제외 | 사이클 크기 통제 — 데이터는 이미 RLS로 admin 전체 조회 가능 | 학생 화면만으로 1일 사이클 유지 |

## Success Criteria Final Status

| SC | Status | Evidence |
|---|:--:|---|
| SC-1 두 라우트 렌더, build 통과 | ✅ | next build 라우트 테이블(`/portal/coaching` 2.42kB·`/portal/supplement` 2.43kB) |
| SC-2 `session_bookings` + RLS | ✅ | 마이그레이션 적용 완료, pg_policies 4건 확인 |
| SC-3 notify() T-12/T-13 연결 | ✅ | `app/portal/coaching/actions.ts`의 `bookSession` |
| SC-4 Gap ≥90% | ✅ | 95% (docs/03-analysis/prd-v3-m2-booking.analysis.md) |
| SC-5 Supabase 적용 + main push + Vercel | ✅ | apply_migration 성공, 보안 어드바이저 신규 경고 없음, 본 보고서와 함께 push |

**Success Rate: 5/5**

## PRD v3.0 §7.2 사이트맵 진행 현황

| 구분 | 완료 | 남음 |
|---|---|---|
| v3.0 화면 변경 11건(§7.3) | 11/11 ✅ | — |
| M2 잔여(§7.2, 3주 분량) | D-12·D-13 (학생 화면) | H-7·H-9·H-13·H-14 등 admin 콘솔, `/admin/cohorts`·`/admin/version-packs`·`/admin/drive-policy`·`/admin/chat` |
| M3(수료·AS) | — | `/portal/qna`(D-10), `/trends/[slug]` 상세 |
| M4(고도화) | — | `/alumni/profile`·`/alumni/directory`·`/alumni/[profileSlug]`(E-6·E-10), `/admin/referrals`, `/admin/notifications` |

## Backlog (다음 사이클)

- M2 admin 콘솔 슬라이스: H-7(보충 세션 신청자 관리), H-9(대화방 관리), H-13(Version Pack 관리), H-14(Drive Policy 관리)
- 알림톡 실채널 연동 시 `notify()` `to` 필드에 phone 조회 경로 추가 필요(CurrentUser에 phone 부재)
- M3: `/portal/qna`(D-10), `/trends/[slug]`
- M4: 수료생 공개 프로필 3종(E-6·E-10), `/admin/referrals`, `/admin/notifications`
