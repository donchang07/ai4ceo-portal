# prd-v30-remaining Design (PDCA Design)

- **Date**: 2026-07-21 · **Plan**: [prd-v30-remaining.plan.md](../../01-plan/features/prd-v30-remaining.plan.md)
- **PRD Ref**: docs/class/prd v.3.0.md §4 (SCR-01·03·05·07·08·09)
- **디자인 정합**: design_handoff 토큰은 기존 Tailwind 테마·`components/ui.tsx`(Badge dot·1px 카드·필 버튼)로 이미 구현됨 — 신규 화면도 동일 컴포넌트만 사용, 신규 스타일 도입 없음

## 1. 아키텍처 결정

- Option C 유지(선행 사이클): 서비스 레이어 신설 없이 서버 컴포넌트 + 클라이언트 뷰 + Supabase 직접 호출
- 페이지 골격: `page.tsx`(서버, requireXxx 게이트 + 데이터 페치) → `*-view.tsx`(클라이언트) 패턴 재사용
- 모든 신규 테이블은 RLS 동반 (CLAUDE 규칙: RLS 없이 배포 금지)

## 2. 파일 계획 (§5.1)

| # | 파일 | 신규/수정 | 내용 |
|---|---|---|---|
| 1 | `supabase/migrations/20260721100000_prd_v30_remaining.sql` | 신규 | §3 전체 |
| 2 | `app/program/page.tsx` | 수정 | 자가진단·Build 미리보기·비교 섹션 삽입 (서버에서 public builds 페치) |
| 3 | `app/program/self-check.tsx` | 신규 | 5문항 자가진단 (클라이언트, 비저장) |
| 4 | `app/portal/billing/page.tsx` | 수정 | enrollment(위임 이메일)·invoice 페치 후 뷰에 전달 |
| 5 | `app/portal/billing/billing-view.tsx` | 수정 | 위임 패널(등록/해제) + 위임 배지 |
| 6 | `app/portal/builds/page.tsx` | 신규 | requireLmsAccess + 내 builds 페치 |
| 7 | `app/portal/builds/builds-view.tsx` | 신규 | 목록·등록·편집·적용 추적·공개 토글 |
| 8 | `app/portal/sessions/[id]/page.tsx` | 수정 | 지난 세션이면 CatchupChecklist 렌더 (진행 상태 페치) |
| 9 | `app/portal/sessions/[id]/catchup-checklist.tsx` | 신규 | 4단계 체크리스트 (upsert 저장) |
| 10 | `app/portal/roadmap/page.tsx` | 신규 | requireLmsAccess + roadmap·builds 페치 |
| 11 | `app/portal/roadmap/roadmap-view.tsx` | 신규 | 4단계 편집 + Build 연결 + 발표 모드 |
| 12 | `app/alumni/archive/page.tsx` | 신규 | requireArchiveAccess + 기수·세션·영상·자료 페치 |
| 13 | `app/alumni/archive/archive-view.tsx` | 신규 | 기수 필터 + 주차 아코디언 목록 |
| 14 | `components/portal-shell.tsx` | 수정 | nav에 내 결과물·AX 로드맵 추가 |
| 15 | `components/alumni-shell.tsx` | 수정 | 아카이브 링크를 /alumni/archive로 교체 |

## 3. 마이그레이션 설계 (§3.1)

```sql
-- (a) builds: 적용 추적 (SCR-05)
alter table builds add column if not exists apply_status text not null default 'none'
  check (apply_status in ('none','review','pilot','applied'));
alter table builds add column if not exists effect_memo text;

-- (b) enrollments: 결제 실무 위임 (SCR-03)
alter table enrollments add column if not exists billing_delegate_email text;

-- invoices/tax_invoices SELECT 정책에 위임 이메일 추가 (drop+create)
invoices_self  : enrollment.user_id = auth.uid() OR lower(billing_delegate_email)=lower(jwt.email) OR is_admin()
taxinv_self    : 동일 조인 경로로 확장

-- 위임 저장: enrollments UPDATE는 admin 전용(학생의 status 조작 방지)이므로
-- security definer 함수 set_billing_delegate(p_enrollment_id, p_email)로
-- 본인 enrollment의 billing_delegate_email 한 컬럼만 갱신 (email 형식 검증 포함)

-- (c) session_catchups (SCR-07)
create table session_catchups (
  id uuid pk, user_id uuid ref profiles cascade, session_id uuid ref sessions cascade,
  watched bool, materials_done bool, assignment_done bool, asked_ai bool,
  completed_at timestamptz, updated_at timestamptz, unique(user_id, session_id));
RLS: sel/ins/upd = user_id = auth.uid() or is_admin() · del = admin only

-- (d) roadmaps (SCR-08)
create table roadmaps (
  id uuid pk, user_id uuid ref profiles cascade, cohort_id uuid ref cohorts,
  status text default 'draft' check (draft|final),
  diagnosis text, priorities text, plan_90d text, expansion text,
  build_ids uuid[] default '{}', updated_at, created_at, unique(user_id));
RLS: sel = 본인 or is_admin (assistant 열람은 백로그) · ins/upd = 본인 or admin · del = admin

-- (e) 동문 아카이브 read 확장 (SCR-09)
create function has_active_membership() returns boolean
  security definer, search_path=public:
  exists(select 1 from memberships where user_id=auth.uid() and status='active'
         and (expires_at is null or expires_at > now()));
sessions_read  += or (is_published and has_active_membership())
videos_read    += or exists(sessions s where s.id=session_id and s.is_published and has_active_membership())
materials_read += 동일 패턴
```

인덱스: `idx_session_catchups_user (user_id, session_id)` unique로 대체 · `idx_builds_public (visibility) where visibility='public'`

## 4. 화면 설계 (§5.4 체크리스트)

### F1 /program (SCR-01) — 7항목
1. 자가진단 카드: 5문항(코딩 경험/가용 시간/AX 상황/직접 만들 업무/역할) 각 3택
2. 결과: 점수 합산 → 3구간(적극 추천/추천/상담 권장) 결과 카드 + 맞춤 문구 + 지원 CTA
3. 응답 미저장(상태만 클라이언트) — 개인정보 미수집
4. Build 미리보기: visibility='public' builds 최대 3건(제목·설명·적용 배지), 0건이면 섹션 숨김
5. 비교 섹션: 3축(실습·CEO 의사결정·수료 후 지속) × 4대안(본 과정/최고위과정/플랫폼 강의/유튜브) 정적 표
6. 모집 상태에 따른 CTA 문구는 기존 페이지 로직 승계
7. 섹션 순서: 히어로 → 대상 → 자가진단 → 커리큘럼 → Build 미리보기 → 비교 → FAQ

### F2 /portal/billing (SCR-03) — 6항목
1. 서버에서 enrollment(id, billing_delegate_email)·최신 invoice 페치
2. 위임 패널: 이메일 입력 → 저장(enrollments update) → 위임 중 배지 표시
3. 위임 해제 버튼 → null update
4. 위임 상태 배지: 상단에 "○○@…에게 위임됨" (Badge tone=info)
5. invoice 실데이터 있으면 금액·번호 반영, 없으면 기존 상수 fallback
6. 실패 시 인라인 에러 문구

### F3 /portal/builds (SCR-05) — 7항목
1. requireLmsAccess. 내 builds 목록(최신순) 페치
2. 등록 폼: 제목·설명·데모/저장소 URL·관련 주차
3. 적용 추적: apply_status 4단계 Chip(미기록/검토중/파일럿/적용완료) + effect_memo Textarea
4. 공개 동의 토글: visibility cohort↔public (public 시 /program 노출 안내)
5. 카드에 적용 상태 Badge(dot 색: none=neutral/review=wait/pilot=progress/applied=done)
6. 편집·저장은 인라인(선택 카드 확장)
7. 빈 상태: 안내 + 첫 등록 유도

### F4 sessions/[id] 따라잡기 (SCR-07) — 5항목
1. 세션 starts_at < now 일 때만 체크리스트 카드 노출
2. 4단계: 영상 시청→자료 확인→과제 제출→(막히면) AI 조교, 각 체크 시 session_catchups upsert
3. 전체 완료 시 completed_at 기록 + "따라잡기 완료" Badge(done)
4. 진행률 Progress 바
5. 항목별 관련 링크(영상 섹션 앵커·자료·/portal/assignments·/portal/ai)

### F5 /portal/roadmap (SCR-08) — 7항목
1. requireLmsAccess. 내 roadmap 1건(unique) + 내 builds 페치
2. 4단계 템플릿: 현황 진단→우선 과제→90일 계획→확산 계획, 각 Textarea + 가이드 문구
3. 저장(수동 버튼) — upsert(user_id unique)
4. Build 연결: 내 builds 다중 선택(build_ids)
5. 상태 전환: 초안 저장 / 발표본 확정(status=final)
6. 발표 모드: 전체화면 오버레이(단계별 목차 네비 + 연결 Build 표시)
7. 빈 상태: 샘플 가이드 문구

### F6 /alumni/archive (SCR-09) — 6항목
1. requireArchiveAccess (멤버십 게이트는 auth 헬퍼가 이미 처리 — 만료 시 /alumni/membership 리다이렉트)
2. 기수 목록 페치(cohorts) → 기수 Chip 필터
3. 선택 기수의 세션(주차 순) + 각 세션 영상·자료 목록
4. 진행 중 기수(ends_at 미래 또는 status active)는 "종료 후 공개" 잠금 표시
5. 영상은 링크(read-only) · 자료는 다운로드 링크
6. 빈 상태: 공개된 콘텐츠 없음 안내

## 5. 계약 (Contract)

- `session_catchups` upsert: `onConflict: "user_id,session_id"` — 클라이언트 insert/update 필드는 4 bool + completed_at
- `roadmaps` upsert: `onConflict: "user_id"` — 필드: diagnosis/priorities/plan_90d/expansion/build_ids/status/cohort_id
- 위임 저장: `rpc('set_billing_delegate', { p_enrollment_id, p_email })` — email=null이면 해제
- `builds` insert/update: title/description/repo_url/apply_status/effect_memo/visibility (user_id = auth.uid() 강제)
- /program 서버 페치: `builds.select().eq('visibility','public').limit(3)` — anon 접근은 builds_read 정책이 보장
- 아카이브 페치: sessions(is_published).order(week_no) + videos/materials in(session_ids) — RLS 확장으로 멤버십 동문 접근 가능
