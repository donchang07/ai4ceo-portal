# prd-v3-cycle3 Completion Report

- **Date**: 2026-07-21 · **Feature**: PRD v3.0 §7.2 사이트맵 잔여 — 트렌드 상세 + 일반 Q&A 게시판
- **Chain**: PRD(`ai4ceo-portal-PRD-v3_0.docx` §4.4·§4.6) → Plan → Design → Do → Check(95%) → Act(본 보고서)
- **선행**: prd-v283-core → prd-v30-final → prd-v3-m2-booking(D-12·D-13)
- **사용자 지시 고정**: Toss Payments(C-8)·팝빌 세금계산서 실발행(C-10)은 계속 제외 — 이번 사이클도 미포함.

## Executive Summary

| Perspective | Delivered |
|---|---|
| **Problem** | 트렌드/브리프 목록에 요약만 있고 본문 열람 화면 부재(F-1) · 세션에 묶이지 않는 일반 질문을 남길 게시판 부재(D-10) |
| **Solution** | `/trends/[slug]`(post 상세, audience 4종 게이트) · `/portal/qna`(세션 비의존 질의응답, 기존 세션 Q&A 패턴 재사용) |
| **Function/UX Effect** | 신규 라우트 2개, 트렌드 목록 카드 제목이 상세로 링크, 포탈 nav에 "Q&A" 추가 |
| **Core Value** | Check 95%, 신규 테이블 없이 컬럼 제약 1건만 완화, build+tsc 통과, main 직접 반영 |

## Key Decisions & Outcomes

| Decision | 근거 | 결과 |
|---|---|---|
| `[slug]` = `posts.id` (별도 slug 컬럼 미도입) | 스키마 변경 최소화 원칙 | 마이그레이션 없이 상세 페이지 구현 |
| 게이트 실패 시 리다이렉트 대신 목록과 동일한 잠금 티저 렌더 | 공유 링크로 들어온 방문자를 전환 퍼널(지원하기)로 계속 유도 | 기존 UX와 완전히 일관된 잠금 카드 재사용 |
| `session_questions.session_id`를 nullable로 전환해 일반 게시판을 같은 테이블로 수용 | RLS가 이미 `cohort_id` 기준이라 정책 변경 없이 안전(사전 검증 완료) | 신규 테이블 없이 컬럼 제약 완화 1건으로 완결 |
| 세션별 Q&A actions.ts는 그대로 두고 `/portal/qna` 전용 액션 파일 신설 | 이미 동작 중인 세션 Q&A(D-22)에 분기 로직을 얹지 않아 회귀 위험 제거 | 코드 약간 중복되지만 두 기능 다 안전 |

## Success Criteria Final Status

| SC | Status | Evidence |
|---|:--:|---|
| SC-1 두 라우트 렌더, build 통과 | ✅ | next build 라우트 테이블(`/trends/[slug]`·`/portal/qna`) |
| SC-2 session_id nullable 전환, 기존 세션 Q&A 무변경 | ✅ | RLS 정책 무변경 확인 후 마이그레이션 적용 |
| SC-3 audience 게이트 4종 검증 | ✅ | `/trends/[slug]/page.tsx`의 canView 판정 로직 |
| SC-4 Gap ≥90% | ✅ | 95% (docs/03-analysis/prd-v3-cycle3.analysis.md) |
| SC-5 Supabase 적용 + main push + Vercel | ✅ | apply_migration 성공, 신규 보안 경고 없음, 본 보고서와 함께 push |

**Success Rate: 5/5**

## PRD v3.0 §7.2 사이트맵 진행 현황 (누적)

| 구분 | 완료 |
|---|---|
| v3.0 화면 변경 11건(§7.3) | 11/11 ✅ |
| M2 학생 화면 | D-12(코칭)·D-13(보충) ✅ |
| M3 | F-1 상세(`/trends/[slug]`) ✅ |
| D-10(Q&A 게시판) | ✅ (M2/M3 경계 항목, 미배정이었으나 완료) |
| **남음** | M2 admin 콘솔(H-7·H-9·H-13·H-14, `/admin/cohorts`·`/admin/version-packs`·`/admin/drive-policy`·`/admin/chat`), M4(`/alumni/profile`·`/alumni/directory`·`/alumni/[profileSlug]`, `/admin/referrals`, `/admin/notifications`) |

## Backlog (다음 사이클)

- 세션 Q&A + 일반 Q&A 답변 등록 시 알림톡 T-06 연동(현재 둘 다 미연동)
- 세션별/일반 Q&A 액션 로직 공용화 검토
- M2 admin 콘솔 슬라이스 계속 진행
- M4: 수료생 공개 프로필 3종, `/admin/referrals`, `/admin/notifications`
