# prd-v3-cycle5 Plan (PDCA Plan)

- **Date**: 2026-07-21 · **PRD 정본**: `ai4ceo-portal-PRD-v3_0.docx` §4.5(E-6·E-10), §7.2
- **선행 사이클**: prd-v283-core → prd-v30-final → prd-v3-m2-booking → prd-v3-cycle3 → prd-v3-cycle4(M2 admin)
- **사용자 지시**: "M2 admin 콘솔 + M4 수료생 공개, 둘 다" — 본 사이클이 후반부(M4).
- **고정 제외**: Toss(C-8)·팝빌 실발행(C-10).

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 수료생 선택형 공개 프로필(E-6)과 동문 디렉토리(E-10)가 사이트맵에는 있으나 실제 라우트가 없음 — `/alumni-shell`의 "디렉토리" 링크가 `/alumni#directory`(존재하지 않는 앵커)로만 걸려 있음 |
| **WHO** | 동문(alumni)·admin |
| **RISK** | `profiles` 테이블 RLS(`id=auth.uid() or is_admin()`)는 타인의 name/company/title 조회를 막는다 — 디렉토리·공개 프로필에서 타인 정보를 보여주려면 조인이 아니라 기존 코드 관례(세션 Q&A의 `author_name` 등)와 동일하게 **저장 시점 비정규화**가 필요 |
| **SUCCESS** | build+tsc 통과, Check ≥90%, Supabase 적용, main push |
| **SCOPE** | F1 `/alumni/profile`(자기 프로필 편집, E-6) · F2 `/alumni/directory`(동문 디렉토리, E-10) · F3 `/alumni/[profileSlug]`(공개 프로필) |

## 사전 결정

| # | 결정 | 근거 |
|---|---|---|
| D-1 | 신규 테이블 `alumni_profiles`(user_id 1:1) — `profiles`에 컬럼 추가하지 않음 | E-6 필드(사진·이력·전문분야·회사소개·홈페이지·연락관심사·공개메시지)가 대부분 비어있을 sparse 데이터라 별도 테이블이 적합 |
| D-2 | 표시용 이름·직함·회사명은 `alumni_profiles`에 **저장 시점 값을 복제**(denormalize) — `profiles` 조인 안 함 | `profiles` RLS가 본인/admin만 허용해 타인 정보 조인이 막힘. 코드베이스 기존 관례(`session_questions.author_name` 등)를 그대로 따름 — RLS 완화보다 안전 |
| D-3 | 공개 범위 3단계(`private`/`alumni_only`/`public`), 연락처는 별도 필드(`contact_email`)+토글(`show_contact`)로 분리 | PRD E-6·E-10 원문 "연락처는 별도 동의 항목으로 분리" 그대로 반영 |
| D-4 | `[profileSlug]`는 `posts`/`sessions`와 동일하게 `user_id`를 그대로 사용(별도 slug 컬럼 없음) | cycle3(D-1)과 일관된 결정 |
| D-5 | `/alumni/[profileSlug]`는 하드 게이트 없이 소프트 렌더 — RLS가 걸러준 값이 없으면(비공개) trends 상세와 동일한 "비공개" 티저 표시 | 외부에 공유된 프로필 링크가 깨진 페이지로 보이지 않도록 |
| D-6 | `/alumni/profile`·`/alumni/directory`는 `requireAlumniAccess`로 하드 게이트(재학생·비회원 접근 불가) | 기존 `/alumni/membership` 등과 동일한 "동문 전용" 포지션 |
| D-7 | 신규 SQL 함수 `is_alumni()` — `has_active_membership()`와 동일한 security definer 패턴, anon 실행 차단 | 기존 관례 재사용 |

## Success Criteria

- **SC-1**: 3개 라우트 렌더, build 통과
- **SC-2**: `alumni_profiles` 신규 테이블 + RLS(본인/admin/공개범위별 select), `is_alumni()` 함수
- **SC-3**: 비공개 프로필을 외부에서 열람 시 깨지지 않고 티저로 처리
- **SC-4**: Gap ≥90%
- **SC-5**: Supabase 적용 + main push
