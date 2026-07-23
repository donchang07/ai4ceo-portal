# prd-v3-m2-booking Design (PDCA Design)

- **Date**: 2026-07-21 · **Plan**: [prd-v3-m2-booking.plan.md](../../01-plan/features/prd-v3-m2-booking.plan.md)
- **PRD 정본**: `ai4ceo-portal-PRD-v3_0.docx` §4.4 D-12·D-13

## 1. 마이그레이션 설계

```sql
create table if not exists session_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'booked' check (status in ('booked','cancelled')),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (session_id, user_id)
);
alter table session_bookings enable row level security;

create policy bookings_sel on session_bookings for select using (user_id = auth.uid() or is_admin());
create policy bookings_ins on session_bookings for insert with check (user_id = auth.uid() or is_admin());
create policy bookings_upd on session_bookings for update
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
```

- `sessions.capacity`(기존 컬럼) 대비 `session_bookings`에서 `status='booked'` 건수를 세어 정원 표시(하드 제약 없음, Plan D-3).
- 세션 자체의 열람 가능 여부는 기존 `sessions_read` RLS가 게이트(재학생: `is_enrolled(cohort_id)`).

## 2. 파일 계획

| # | 파일 | 내용 |
|---|---|---|
| 1 | `supabase/migrations/20260721200000_session_bookings.sql` | 위 스키마 |
| 2 | `app/portal/coaching/page.tsx` | requireLmsAccess + type='coaching' 세션·본인 예약 페치 |
| 3 | `app/portal/coaching/coaching-view.tsx` | 슬롯 목록, 예약/취소, 정원 표시 |
| 4 | `app/portal/supplement/page.tsx` | requireLmsAccess + type='offline_supplement' 세션·본인 예약 페치 |
| 5 | `app/portal/supplement/supplement-view.tsx` | 신청/취소, 준비물 안내(PRD D-13 문구) |
| 6 | `app/portal/coaching/actions.ts` | 서버 액션 `bookSession`/`cancelBooking` — notify() T-12/T-13 호출(공용) |
| 7 | `components/portal-shell.tsx` | nav에 "코칭 예약"·"보충수업" 추가 |

## 3. F1 `/portal/coaching` (D-12)

- 목록: `sessions.select().eq('type','coaching').eq('is_published',true).order('starts_at')`
- 각 슬롯: 일시·정원(`booked/capacity`)·내 예약 상태 배지
- 예약 버튼 → 서버 액션 `bookSession(sessionId)` → `session_bookings` upsert(status='booked') → `notify({templateCode:'T-12', ...})`
- 취소 → `cancelBooking(sessionId)` → status='cancelled'
- 빈 상태: "현재 예약 가능한 코칭 슬롯이 없습니다" + 문의 안내(코칭은 상시가 아니라 운영자가 슬롯을 여는 방식이므로 스텁 아님)

## 4. F2 `/portal/supplement` (D-13)

- 목록: `type='offline_supplement'` 세션
- PRD 문구 반영: "복습 위주 — 질의응답·설치·실행·버그 수정 지원, 정규 진도와 무관, Zoom 방송·녹화 없음"을 안내 카드로 고정 노출
- 신청/취소는 F1과 동일 컴포넌트 패턴(공용 액션 파일 재사용, templateCode만 T-13으로 분기)

## 5. 계약 (Contract)

- `bookSession(sessionId: string, templateCode: 'T-12'|'T-13')`, `cancelBooking(sessionId: string)` — 두 화면이 공유
- `notify()` 시그니처 무변경
- 신규 테이블 1개, RLS 3정책, 컬럼 변경 없음
