# prd-v283-core Design Document

> **Summary**: /apply/status(공개 조회) · AI 조교 에스컬레이션(+/admin/ai) · /portal/tasks(위임 할 일) 상세 설계
>
> **Project**: ai4ceo-portal (apps/ai4ceo)
> **Date**: 2026-07-20
> **Status**: Approved (사용자 위임 — Option C 자동 채택)
> **Planning Doc**: [prd-v283-core.plan.md](../../01-plan/features/prd-v283-core.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 지원 상태 불투명·AI 막힘 방치·위임 수단 부재가 각각 모집 퍼널·완주율·동반자 모델을 깨뜨림 |
| **WHO** | 지원자(비로그인) · 수강생 CEO(enrolled+) · 동반 assistant · admin |
| **RISK** | applications는 admin 전용 SELECT — 공개 조회는 security definer 함수로만, 개인정보 최소 반환 |
| **SUCCESS** | build+tsc 통과, 3개 화면 동작, 신규 테이블 RLS 동반 배포, Vercel 프로덕션 반영 |
| **SCOPE** | F1 /apply/status · F2 AI 에스컬레이션+/admin/ai · F3 /portal/tasks+delegated_tasks |

---

## 1. Overview

- **Design Goals**: 기존 컨벤션(서버 page 가드 + 클라이언트 `*-view.tsx`, `components/ui.tsx` 프리미티브, Tailwind 시맨틱 토큰) 100% 재사용. 신규 의존성 0. service_role 미사용.
- **Principles**: RLS가 유일한 데이터 경계 / 화면당 파일 2개(page+view) / 마이그레이션 1파일 완결

## 2. Architecture Options

| Criteria | A: Minimal | B: Clean | C: Pragmatic |
|---|:-:|:-:|:-:|
| Approach | 모든 로직을 view에 인라인 | lib/tasks·lib/apply 서비스 레이어 신설 | 기존 패턴 그대로: page+view, DB 직접(RLS), 함수는 마이그레이션에 |
| New Files | 5 | 11 | 7 |
| Effort | Low | High | Medium |
| **Selected** | | | ✅ |

**Rationale**: 코드베이스가 이미 "view에서 supabase-client 직접 호출"(apply 폼) 패턴 — 서비스 레이어 신설은 이 규모에서 과설계.

### 2.2 Data Flow

```
F1: /apply/status view → supabase.rpc('lookup_application_status', {email, phone}) → SECURITY DEFINER fn → applications (RLS 우회, 3필드만)
F2: /portal/ai view → (기존 스트리밍 그대로) → [해결 안 됨 클릭] → supabase.from('ai_question_logs').insert(status='escalated') → /admin/ai 서버 컴포넌트가 is_admin RLS로 조회
F3: /portal/tasks view → supabase.from('delegated_tasks') select/insert/update → RLS(ceo/assistant email/admin)
```

## 3. Data Model

### 3.1 Migration: `apps/ai4ceo/supabase/migrations/20260720100000_prd_v283_core.sql`

```sql
-- 1) delegated_tasks (US-07)
create table if not exists delegated_tasks (
  id uuid primary key default gen_random_uuid(),
  ceo_user_id uuid not null references profiles(id) on delete cascade,
  assistant_email text not null,
  title text not null,
  note text,
  source_type text not null default 'other'
    check (source_type in ('assignment','material','schedule','other')),
  status text not null default 'pending'
    check (status in ('pending','in_progress','done')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index ... on delegated_tasks (ceo_user_id, created_at desc);
create index ... on delegated_tasks (lower(assistant_email));
alter table delegated_tasks enable row level security;
-- select/update: CEO 본인 · JWT email이 assistant_email과 일치 · admin
-- insert: ceo_user_id = auth.uid() (or admin) / delete: CEO or admin

-- 2) 지원 상태 공개 조회 (US-03) — email+phone 완전 일치 시 3필드만
create or replace function public.lookup_application_status(p_email text, p_phone text)
returns table (app_status text, cohort_name text, submitted_at timestamptz)
language sql security definer set search_path = public as $$
  select a.status::text, coalesce(c.name,''), a.created_at
  from applications a left join cohorts c on c.id = a.cohort_id
  where lower(a.email) = lower(trim(p_email))
    and regexp_replace(coalesce(a.phone,''), '\D', '', 'g') = regexp_replace(coalesce(p_phone,''), '\D', '', 'g')
    and length(regexp_replace(coalesce(p_phone,''), '\D', '', 'g')) >= 10
  order by a.created_at desc limit 3;
$$;
revoke all on function ... from public;
grant execute ... to anon, authenticated;
```

`ai_question_logs`는 스키마 무변경 — 에스컬레이션은 신규 insert(`status='escalated'`, `topic='escalation'`)로 기존 `ailogs_ins` 정책(`user_id = auth.uid()`) 내에서 동작.

### 3.2 TypeScript Types (view 로컬 정의)

```typescript
type DelegatedTask = {
  id: string; ceo_user_id: string; assistant_email: string;
  title: string; note: string | null;
  source_type: "assignment" | "material" | "schedule" | "other";
  status: "pending" | "in_progress" | "done";
  created_at: string;
};
type ApplyStatusRow = { app_status: string; cohort_name: string; submitted_at: string };
```

## 4. API Specification

신규 API 라우트 없음 (Supabase RLS 직접 + RPC). 기존 `POST /api/ai/tutor` 무변경.

| 호출 | 방식 | Auth |
|---|---|---|
| `rpc lookup_application_status(p_email, p_phone)` | supabase-client RPC | 공개(anon) — 함수 내부에서 완전 일치 검증 |
| `delegated_tasks` select/insert/update | supabase-client | 세션 + RLS |
| `ai_question_logs` insert(escalated) | supabase-client | 세션 + RLS |
| `/admin/ai` 데이터 | supabase-server (서버 컴포넌트) | admin RLS |

## 5. UI/UX Design

### 5.1 파일 구조

```
app/apply/status/page.tsx          [N] 서버 — 가드 없음(공개)
app/apply/status/status-view.tsx   [N] 클라이언트 — 조회 폼+결과
app/portal/tasks/page.tsx          [N] 서버 — requireLmsAccess + getCurrentUser 전달
app/portal/tasks/tasks-view.tsx    [N] 클라이언트 — 목록+생성+상태 변경
app/admin/ai/page.tsx              [N] 서버 — admin 가드 + escalated 목록 (기존 admin 페이지 가드 패턴 준용)
app/portal/ai/ai-tutor-view.tsx    [U] 답변 말풍선 하단 에스컬레이션 UI
components/portal-shell.tsx        [U] nav "할 일" 추가
supabase/migrations/20260720100000_prd_v283_core.sql [N]
```

### 5.4 Page UI Checklist

#### /apply/status
- [ ] Input: 이메일 (type=email, 필수)
- [ ] Input: 전화번호 (필수, 숫자 10자리 이상 zod 검증)
- [ ] Button: "상태 조회" (조회 중 disabled)
- [ ] 결과 카드: 기수명 + 접수일 + 상태 배지
- [ ] 상태 3단계 표시: 접수(received) → 심사중(reviewing) → 발표(accepted/rejected/waitlist) — 현재 단계 강조
- [ ] 미조회/불일치 시: "일치하는 지원 내역이 없습니다" 안내 + /apply 링크
- [ ] 검증 실패 시 인라인 에러 메시지

#### /portal/ai (에스컬레이션 추가분)
- [ ] Button: AI 답변 하단 "이 답변으로 해결되지 않았어요" (assistant 말풍선마다)
- [ ] 클릭 시: ai_question_logs에 escalated insert (질문+답변 요약 포함)
- [ ] 완료 상태 카드: "교수 검수 큐에 전달됨" + 후속 안내(다음 세션 질의·보충 세션) 텍스트
- [ ] 중복 클릭 방지 (전달됨 상태로 버튼 치환)

#### /portal/tasks
- [ ] Form: 제목(필수) / assistant 이메일(필수, email 검증) / 유형 select(assignment·material·schedule·other) / 메모(선택)
- [ ] Button: "위임하기"
- [ ] List: 내가 위임한 할 일 + 나에게 위임된 할 일 (구분 배지: 위임함/받음)
- [ ] 각 항목: 제목, 유형 칩, 상태 배지(대기/진행/완료), 상태 변경 버튼
- [ ] 빈 상태: 안내 문구
- [ ] 실패 시 에러 메시지 (스키마 미적용 대비 try/catch — 기존 apply 폼 관례)

#### /admin/ai
- [ ] 목록: escalated 질문 (질문·답변 발췌·요청자 이름/회사·일시) 최신순 50건
- [ ] 상태 배지: escalated
- [ ] 빈 상태: "에스컬레이션된 질문이 없습니다"

## 6. Error Handling

| 상황 | 처리 |
|---|---|
| RPC 결과 0건 | "일치하는 지원 내역 없음" 안내 (401/404 노출 없음 — 열거 공격 방지) |
| DB 미적용/오류 | try/catch 후 사용자 친화 메시지 (기존 관례) |
| 비인증 /portal/tasks | requireLmsAccess가 redirect |
| 비admin /admin/ai | admin 가드 redirect |

## 7. Security

- [x] 신규 테이블 RLS 동반 배포 (delegated_tasks 4개 정책)
- [x] security definer 함수는 반환 3필드 고정, email+phone 완전 일치, search_path 고정
- [x] zod 입력 검증 (이메일·전화)
- [x] service_role 미사용, 하드코딩 키 없음

## 8. Test Plan

프로젝트에 테스트 인프라 없음(CLAUDE.md: build+tsc+수동 확인이 기준). 본 사이클 검증:

| Level | 방법 |
|---|---|
| L1(정적) | `npm run build` + `npx tsc --noEmit` 통과 |
| L2(구조) | gap-detector: §5.1 파일 존재 + §5.4 체크리스트 요소 구현 확인 |
| L3(수동) | 배포 후 /apply/status 폼 렌더·검증 에러 동작 확인 |

## 11. Implementation Guide

### 11.2 Implementation Order
1. [ ] 마이그레이션 SQL 작성
2. [ ] F1 /apply/status (page+view)
3. [ ] F3 /portal/tasks (page+view) + portal-shell nav
4. [ ] F2 ai-tutor-view 에스컬레이션 + /admin/ai
5. [ ] build + tsc 검증

### 11.3 Session Guide

| Module | Scope Key | Description |
|---|---|---|
| migration | `module-1` | delegated_tasks + lookup fn |
| apply-status | `module-2` | F1 화면 |
| tasks | `module-3` | F3 화면 + nav |
| escalation | `module-4` | F2 수정 + admin/ai |

단일 세션 전체 구현 (사용자 지시: 빠르게).
