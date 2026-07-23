# prd-v3-cycle5 Completion Report

- **Date**: 2026-07-21 · **Feature**: PRD v3.0 M4 수료생 공개 프로필 — E-6·E-10
- **Chain**: PRD(`ai4ceo-portal-PRD-v3_0.docx` §4.5) → Plan → Design → Do → Check(95%) → Act(본 보고서)
- **선행**: prd-v283-core → prd-v30-final → prd-v3-m2-booking → prd-v3-cycle3 → prd-v3-cycle4(M2 admin)
- **사용자 지시**: "M2 admin 콘솔 + M4 수료생 공개, 둘 다" — 본 사이클로 두 요청이 모두 완료.
- **고정 제외**: Toss(C-8)·팝빌 실발행(C-10).

## Executive Summary

| Perspective | Delivered |
|---|---|
| **Problem** | 수료생 선택형 공개 프로필(E-6)·동문 디렉토리(E-10)가 사이트맵에만 있고 라우트 부재 — "디렉토리" nav 링크가 존재하지 않는 앵커였음 |
| **Solution** | `/alumni/profile`(자기소개·공개범위 3단·연락처 분리 편집) · `/alumni/directory`(기수 필터 카드 그리드) · `/alumni/[profileSlug]`(공개 프로필, 비공개 시 티저) |
| **Function/UX Effect** | 신규 라우트 3개, alumni nav에 "디렉토리"(실제 라우트로 교체)·"내 프로필" 반영 |
| **Core Value** | Check 95%, 신규 테이블 1개(`alumni_profiles`) + `is_alumni()` 함수, build+tsc 통과, main 직접 반영 |

## Key Decisions & Outcomes

| Decision | 근거 | 결과 |
|---|---|---|
| 신규 테이블 `alumni_profiles` — `profiles`에 컬럼 추가 안 함 | E-6 필드 대부분이 비어있을 sparse 데이터 | 스키마 분리로 `profiles` 무변경 |
| 표시용 이름·직함·회사명을 저장 시점에 복제(비정규화) | `profiles` RLS(본인/admin만)가 타인 조회를 막음 — 기존 `session_questions.author_name` 관례 재사용 | 디렉토리·공개 프로필이 `profiles` 조인 없이 완결, 민감 테이블 RLS 변경 없음 |
| 공개범위 3단(비공개/동문 전용/전체 공개) + 연락처 별도 토글 | PRD 원문 "완전 optional, 연락처는 별도 동의 항목으로 분리" 그대로 반영 | `show_contact` false면 `contact_email`이 어떤 뷰에서도 노출 안 됨 |
| `/alumni/[profileSlug]`는 하드 게이트 없이 RLS가 자연 필터, null이면 티저 렌더 | 공유된 프로필 링크가 깨진 페이지로 보이지 않도록(cycle3의 trends 패턴과 동일) | 외부 방문자도 "비공개 프로필" 안내를 정상적으로 봄 |

## Success Criteria Final Status

| SC | Status | Evidence |
|---|:--:|---|
| SC-1 3라우트 렌더 | ✅ | next build 라우트 테이블 |
| SC-2 `alumni_profiles` + RLS + `is_alumni()` | ✅ | 마이그레이션 적용 완료 |
| SC-3 비공개 프로필 외부 열람 시 티저 처리 | ✅ | `public-profile.tsx`의 null 분기 |
| SC-4 Gap ≥90% | ✅ | 95% (docs/03-analysis/prd-v3-cycle5.analysis.md) |
| SC-5 Supabase 적용 + main push | ✅ | apply_migration 성공, 예상된 급의 보안 경고만(신규 위험 없음) |

**Success Rate: 5/5**

## PRD v3.0 §7.2 사이트맵 진행 현황 (누적, cycle1~5)

| 구분 | 완료 |
|---|---|
| v3.0 화면 변경 11건(§7.3) | 11/11 ✅ |
| M2 학생 화면(D-12·D-13) | ✅ |
| M2 admin 콘솔(H-1·H-7·H-13 슬라이스) | ✅ |
| M3(F-1 상세, D-10 Q&A) | ✅ |
| M4(E-6·E-10 동문 프로필) | ✅ |
| **남음** | H-9(대화방 관리), H-14(Drive Policy — Drive API 부재로 차단), Version Pack 복제 워크플로, `/admin/referrals`, `/admin/notifications`, 기존 admin 3화면 가드 보강, Toss/팝빌(사용자 지시로 계속 제외) |

## Backlog (다음 사이클 후보)

- `/admin/referrals`(J-3, 추천 성과 대시보드) — M4
- `/admin/notifications`(H-5 수동 발송 + 로그 조회) — M1 잔여
- H-9 대화방 관리(메시지 검색·고정·숨김)
- 프로필 사진 업로드(Storage 연동 필요, 현재 URL 필드조차 미노출)
- 기존 admin 3화면(curriculum·billing·applications) page-level 가드 보강
