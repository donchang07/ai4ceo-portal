# prd-v3-cycle5 Design (PDCA Design)

- **Date**: 2026-07-21 · **Plan**: [prd-v3-cycle5.plan.md](../../01-plan/features/prd-v3-cycle5.plan.md)

## 1. 마이그레이션

```sql
create table if not exists alumni_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  display_name text,
  job_title text,
  company_name text,
  photo_path text,
  bio text,
  expertise text,
  company_description text,
  homepage_url text,
  contact_interest text,
  contact_email text,
  show_contact boolean not null default false,
  public_message text,
  cohort_label text,
  visibility text not null default 'private' check (visibility in ('private','alumni_only','public')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table alumni_profiles enable row level security;

create or replace function public.is_alumni() returns boolean
language sql security definer set search_path = public stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'alumni')
      or exists(select 1 from enrollments where user_id = auth.uid() and status = 'completed');
$$;
revoke all on function public.is_alumni() from public;
grant execute on function public.is_alumni() to authenticated;
revoke execute on function public.is_alumni() from anon;

create policy alumni_profiles_sel on alumni_profiles for select using (
  user_id = auth.uid() or is_admin() or visibility = 'public'
  or (visibility = 'alumni_only' and is_alumni())
);
create policy alumni_profiles_ins on alumni_profiles for insert with check (user_id = auth.uid() or is_admin());
create policy alumni_profiles_upd on alumni_profiles for update
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
create policy alumni_profiles_del on alumni_profiles for delete using (user_id = auth.uid() or is_admin());
```

## 2. 파일 계획

| # | 파일 | 내용 |
|---|---|---|
| 1 | `supabase/migrations/20260721230000_alumni_profiles.sql` | 위 스키마 |
| 2 | `app/alumni/profile/page.tsx` | requireAlumniAccess + 본인 `alumni_profiles`·`profiles`·`enrollments`(기수명) 페치 |
| 3 | `app/alumni/profile/profile-editor.tsx` | 편집 폼(공개 범위 선택 포함) |
| 4 | `app/alumni/directory/page.tsx` | requireAlumniAccess + `visibility in (alumni_only,public)` 목록 페치 |
| 5 | `app/alumni/directory/directory-view.tsx` | 기수·회사 필터 + 카드 그리드 |
| 6 | `app/alumni/[profileSlug]/page.tsx` | 소프트 게이트(RLS가 자연 필터) — `[profileSlug]` = user_id |
| 7 | `app/alumni/[profileSlug]/public-profile.tsx` | 공개 프로필 렌더 + 비공개 티저 |
| 8 | `components/alumni-shell.tsx` | "디렉토리"를 `/alumni/directory`로 교체, "내 프로필" 추가 |

## 3. F1 `/alumni/profile` (E-6)

- 초기값: `alumni_profiles` 행이 없으면 `display_name`=profiles.name, `job_title`=profiles.title, `company_name`=profiles.company, `cohort_label`=본인 enrollment의 cohort명으로 프리필.
- 필드: 사진(URL만, 업로드 인프라 없음 — cycle 범위 밖) · 자기소개(bio) · 전문분야(expertise) · 회사소개(company_description) · 홈페이지 · 연락 관심사(contact_interest) · 공개 메시지(public_message) · 연락처 공개 토글(show_contact)+이메일(contact_email).
- 공개범위 3단 Chip(비공개/동문 전용/전체 공개) — 기본 비공개, 저장 전까지 아무 변화 없음("아무것도 안 올려도 불이익 없음" 원칙).
- 저장은 `upsert(onConflict: user_id)`.
- 내 공개 프로필 링크(`/alumni/{userId}`) 미리보기 버튼(visibility!=private일 때만 노출).

## 4. F2 `/alumni/directory` (E-10)

- 페치: `alumni_profiles.select("*").in("visibility", ["alumni_only","public"]).order("updated_at", desc)` — RLS가 뷰어의 동문 자격을 이미 확인(cycle5 D-2에 따라 profiles 조인 없이 표시 필드 전부 alumni_profiles 자체 컬럼 사용).
- 필터: 기수(cohort_label distinct Chip) · 회사(company_name distinct Chip, 값 있는 경우만).
- 카드: display_name·job_title·company_name·bio 요약·연락 관심사 태그, 클릭 시 `/alumni/{user_id}`.

## 5. F3 `/alumni/[profileSlug]` (공개 프로필)

- `[profileSlug]` = `alumni_profiles.user_id`. `getSupabaseServer()`로 단건 조회 — RLS가 비공개면 null 반환.
- null이면 trends 상세와 동일한 톤의 "비공개 프로필" 티저(로그인 유도 대신 "동문에게만 공개된 프로필입니다" 안내, 하드 404는 아님).
- 값이 있으면: 이름·직함·회사·소개·전문분야·홈페이지·연락 관심사, `show_contact`가 true일 때만 `contact_email` 노출.

## 6. 계약

- `alumni_profiles` upsert 필드: 위 컬럼 전체(user_id 제외 자동), `onConflict: "user_id"`
- 디렉토리·공개 프로필 조회는 `alumni_profiles` 단일 테이블만 사용(추가 조인 없음) — RLS·비정규화 전략과 정합
