# prd-v3-m2-booking Plan (PDCA Plan)

- **Date**: 2026-07-21 · **PRD 정본**: `ai4ceo-portal-PRD-v3_0.docx` §4.4(D-12·D-13), §7.2(사이트맵), §8(M2)
- **선행 사이클**: prd-v283-core → prd-v30-final(§7.3 v3.0 화면 변경 11건 완결)
- **본 사이클 위치**: v3.0 화면 변경 이후 남은 §7.2 사이트맵 13개 라우트는 M2~M4에 분산. **M2가 가장 크고(3주 분량) P0 항목이 몰려 있어, 한 사이클에 다 담지 않는다.** 본 사이클은 M2의 학생 대상 P0 2건(D-12 1:1 코칭, D-13 오프라인 보충수업)만 다룬다.

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 재학 중 막힌 지점을 즉시 해결할 코칭 예약 수단 부재(D-12), 보충수업 신청·안내 수단 부재(D-13) — 둘 다 완주율(North Star) 직결 |
| **WHO** | 재학생(enrolled/in_training) · assistant · admin |
| **RISK** | 예약 정원 초과 방지는 하드 제약이 아니라 UI 안내 수준(기존 코드 관례상 다른 곳도 동시성 하드락 없음) |
| **SUCCESS** | build+tsc 통과, Check ≥90%, Supabase 적용, main push, Vercel 배포 |
| **SCOPE** | F1 `/portal/coaching` · F2 `/portal/supplement` — 둘 다 `sessions`(type='coaching'/'offline_supplement') 위에 예약 레이어만 추가 |

## 스코프 밖(백로그로 명시)

- H-7(보충 세션 관리 admin), H-9(대화방 관리), H-13(Version Pack 관리), H-14(Drive Policy 관리) 등 M2의 관리자 콘솔 쪽 — 이번 사이클은 학생 화면만
- `/admin/cohorts`, `/admin/version-packs`, `/admin/drive-policy`, `/admin/chat`, `/admin/referrals`, `/admin/notifications`
- `/portal/qna`(D-10, P1), `/trends/[slug]`(F-1 상세), `/alumni/profile`·`/alumni/directory`·`/alumni/[profileSlug]`(E-6·E-10, P1, M4)
- Toss/팝빌 실연동(C-8·C-10, P1) — 어댑터 구조 자체는 기존 스키마에 존재, 활성화는 별도 오픈 이슈

## Features

| # | 내용 | PRD 근거 |
|---|---|---|
| F1 | `/portal/coaching` — 코칭 슬롯(session type='coaching') 목록, 예약/취소, 확정 시 알림톡 T-12 | D-12, P0 |
| F2 | `/portal/supplement` — 보충수업 세션(type='offline_supplement') 목록, 신청/취소, 확정 시 알림톡 T-13 | D-13, P0 |

## 사전 결정

| # | 결정 | 근거 |
|---|---|---|
| D-1 | `sessions` 테이블을 슬롯 저장소로 재사용 — 신규 슬롯 테이블 만들지 않음 | schema에 `session_type`이 이미 `coaching`·`offline_supplement`를 포함(스키마 확인 완료), 18기 보충수업 1건이 이미 이 타입으로 시딩되어 있음 |
| D-2 | 예약은 신규 테이블 `session_bookings` 1개(세션↔사용자, status booked/cancelled) — coaching·supplement 공용 | 두 화면이 "슬롯에 예약한다"는 동일 패턴이라 테이블 분리 불필요 |
| D-3 | 정원 초과는 UI 안내(예약 인원/정원 표시, 초과 시 경고)로 처리, DB 하드 제약 없음 | 기존 코드 전반의 낮은 트래픽 가정과 일관 — 과도한 엔지니어링 지양 |
| D-4 | RLS는 `session_catchups`/`roadmaps` 패턴(본인 self-access + admin) 그대로 — 세션 열람 가능 여부는 이미 `sessions_read` RLS가 게이트 | 기존 검증된 패턴 재사용, 이중 게이트 불필요 |
| D-5 | admin 신청자 목록 화면(H-7)은 이번 스코프 제외 — admin은 `is_admin()`으로 전체 행 조회 가능하므로 데이터는 이미 확보됨, UI만 백로그 | 사이클 크기 통제 |

## Success Criteria

- **SC-1**: `/portal/coaching`·`/portal/supplement` 렌더, next build 통과
- **SC-2**: `session_bookings` 신규 테이블 + RLS(본인+admin), 마이그레이션 1개
- **SC-3**: 예약 확정 시 `notify()`로 T-12/T-13 호출
- **SC-4**: Gap ≥90%
- **SC-5**: Supabase 적용 + main push + Vercel 배포
