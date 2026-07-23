# prd-v3-cycle4 Design (PDCA Design)

- **Date**: 2026-07-21 · **Plan**: [prd-v3-cycle4.plan.md](../../01-plan/features/prd-v3-cycle4.plan.md)

## 1. 마이그레이션

```sql
alter table session_bookings add column if not exists attended boolean;
```

신규 테이블 없음. `session_bookings` RLS(`bookings_sel`/`upd`)가 이미 `is_admin()`을 포함해 admin은 전체 행 조회·수정 가능(cycle2에서 검증됨).

## 2. 파일 계획

| # | 파일 | 신규/수정 | 내용 |
|---|---|---|---|
| 1 | `supabase/migrations/20260721220000_booking_attended.sql` | 신규 | 위 ALTER |
| 2 | `app/admin/cohorts/page.tsx` | 신규 | admin 가드 + cohorts·enrollments count 페치 |
| 3 | `app/admin/cohorts/cohorts-table.tsx` | 신규 | 목록 테이블 |
| 4 | `app/admin/bookings/page.tsx` | 신규 | admin 가드 + coaching/offline_supplement 세션·예약 페치 |
| 5 | `app/admin/bookings/bookings-manager.tsx` | 신규 | 슬롯 생성 폼 + 슬롯별 신청자 목록 + 참석 체크 |
| 6 | `app/admin/bookings/actions.ts` | 신규 | `createSlot`·`setAttended` |
| 7 | `app/admin/version-packs/page.tsx` | 신규 | admin 가드 + cohort_version_packs·cohorts 조인 페치 |
| 8 | `app/admin/version-packs/version-packs-panel.tsx` | 신규 | 목록 + 잠금/해제 |
| 9 | `app/admin/version-packs/actions.ts` | 신규 | `toggleLock` |
| 10 | `components/admin-shell.tsx` | 수정 | nav에 "기수 관리"·"예약 관리"·"버전 팩" 추가 |

## 3. F1 `/admin/cohorts`

- 페치: `cohorts.select("*").order("edu_start", desc)` + `enrollments.select("cohort_id").in("cohort_id", ids)`로 기수별 카운트 집계(클라이언트 group-by, 신규 뷰/함수 불필요).
- 표시: 기수명·모집기간·개강~종료·정원·등록 인원·상태(Badge).

## 4. F2 예약 관리 (`/admin/bookings`)

- 슬롯 목록: `sessions.select("*").in("type", ["coaching","offline_supplement"]).order("starts_at")`.
- 슬롯별 신청자: `session_bookings.select("*, profiles(name)").eq("session_id", slotId)` — 신청 상태(booked/cancelled) + `attended` 토글(3단: 미정/참석/불참).
- 슬롯 생성 폼: type(코칭/보충 선택) + 일시 + 장소 또는 Zoom 링크 + 정원 + 설명 → `sessions.insert({..., cohort_id: COHORT_18.id, is_published: true})`. 기존 `insertSession`(curriculum)과 완전히 분리된 액션.
- 참석 체크는 `session_bookings.update({attended})`.

## 5. F3 `/admin/version-packs`

- 페치: `cohort_version_packs.select("*, cohorts(name)").order("created_at", desc)`.
- 표시: 기수명·버전 라벨·잠금 시각(`locked_at`)·변경 요약(`change_summary`).
- 액션: `toggleLock(id)` — `locked_at`이 null이면 `now()`로, 있으면 null로(관리자 판단으로 재오픈 가능하게 — PRD가 "잠금 후 변경은 이력+알림으로 처리"를 원칙으로 하므로 재오픈 자체를 막을 필요는 없음).

## 6. 계약

- `createSlot(input: {type: 'coaching'|'offline_supplement', startsAt, endsAt, place, zoomUrl, capacity, description})`
- `setAttended(bookingId: string, attended: boolean | null)`
- `toggleLock(packId: string)`
- 전부 admin 가드(`getCurrentUser()+isAdmin()`)를 액션 내부에서도 재확인(페이지 가드와 이중 체크, 기존 세션 액션 패턴과 동일)
