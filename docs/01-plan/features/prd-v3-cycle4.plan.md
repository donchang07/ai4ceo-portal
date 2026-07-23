# prd-v3-cycle4 Plan (PDCA Plan)

- **Date**: 2026-07-21 · **PRD 정본**: `ai4ceo-portal-PRD-v3_0.docx` §4.8(H-1~14), §7.2
- **선행 사이클**: prd-v283-core → prd-v30-final → prd-v3-m2-booking → prd-v3-cycle3
- **사용자 지시**: "M2 admin 콘솔 + M4 수료생 공개, 둘 다" — 본 사이클은 M2 admin 콘솔, 다음 사이클(prd-v3-cycle5)에서 M4 동문 프로필.
- **고정 제외**: Toss(C-8)·팝빌 실발행(C-10) — 계속 제외.

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 코칭·보충 슬롯을 admin이 만들 방법이 없음(H-7 일정 등록 누락 — cycle2에서 학생 화면만 만들고 슬롯 생성 UI는 없었음) · 기수 현황을 한눈에 볼 화면 부재 · Version Pack 잠금 상태를 관리자가 볼 수단 부재 |
| **WHO** | admin 전용 |
| **RISK** | 기존 admin 페이지 5개 중 3개(curriculum·billing·applications)가 page-level 가드 없음(선행 사이클에서 이미 백로그로 지적됨) — **신규 3화면은 반드시 가드 적용**, 기존 화면은 이번 스코프 아님 |
| **SUCCESS** | build+tsc 통과, Check ≥90%, Supabase 적용, main push |
| **SCOPE** | F1 `/admin/cohorts`(H-1 일부) · F2 예약 관리+슬롯 생성(H-7) · F3 `/admin/version-packs`(H-13, 조회+잠금만) |

## 스코프 밖(백로그로 명시)

- H-9(대화방 관리) — 메시지 검색·고정·숨김까지 포함하면 별도 사이클 규모
- H-14(Drive Permission Policy 관리) — `lib/drive`가 URL 전용 스텁이라 실제 권한 동기화 대상이 없음(Toss/팝빌과 같은 "외부 API 부재" 이유로 배제)
- Version Pack의 "새 기수 생성 시 템플릿 복제" 마법사 — 이번엔 기존 팩의 조회·잠금만, 복제 워크플로는 별도 사이클
- 기존 admin 페이지 3개의 page-level 가드 부재 — 별도 보안 사이클로 유지(선행 리포트에 이미 기록됨)

## Features

| # | 내용 | PRD 근거 |
|---|---|---|
| F1 | `/admin/cohorts` — 기수 목록(모집·개강·종료일, 정원, 상태, 등록 인원) | H-1(운영 대시보드 일부), 사이트맵 |
| F2 | 예약 관리 — 코칭/보충 슬롯 생성(일시·장소/Zoom·정원·설명) + 신청자 목록 + 참석 체크 | H-7, P0 |
| F3 | `/admin/version-packs` — 기수별 버전 팩 목록, 잠금 상태, 잠금/해제, 변경 요약 표시 | H-13, P0(조회·잠금 범위 한정) |

## 사전 결정

| # | 결정 | 근거 |
|---|---|---|
| D-1 | 신규 admin 화면 3개는 전부 `getCurrentUser()+isAdmin()+redirect` 가드를 페이지 최상단에 명시 | 기존 3개 화면의 가드 누락이 이미 지적된 리스크 — 새로 만드는 화면에서 반복하지 않음 |
| D-2 | 슬롯 생성은 기존 `/admin/curriculum`의 `insertSession`(항상 type='special')을 건드리지 않고, 예약 관리 화면 전용 액션으로 별도 insert | 이미 동작 중인 커리큘럼 에디터에 회귀 위험 없이 분리 |
| D-3 | `session_bookings`에 `attended` 컬럼 추가(nullable boolean) — 신청(status)과 참석 여부를 분리 | H-7 "신청자 목록, 참석 여부"를 정확히 구분해서 관리 |
| D-4 | Version Pack "복제" 로직은 미구현, 조회+잠금(락 타임스탬프 세팅)만 | 복제 마법사는 curriculum_templates·sessions·assignments 등 다중 테이블 스냅샷 로직이 필요해 별도 사이클 규모 |

## Success Criteria

- **SC-1**: 3개 라우트 렌더, build 통과, 전부 admin 가드 적용
- **SC-2**: `session_bookings.attended` 컬럼 추가(마이그레이션 1개), 신규 테이블 없음
- **SC-3**: 관리자가 코칭/보충 슬롯을 생성할 수 있고, 학생 화면(`/portal/coaching`·`/portal/supplement`)에 즉시 반영
- **SC-4**: Gap ≥90%
- **SC-5**: Supabase 적용 + main push
