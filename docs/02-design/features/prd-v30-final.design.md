# prd-v30-final Design (PDCA Design)

- **Date**: 2026-07-21 · **Plan**: [prd-v30-final.plan.md](../../01-plan/features/prd-v30-final.plan.md)
- **PRD 정본**: `ai4ceo-portal-PRD-v3_0.docx` §7.3·§9

## 1. 파일 계획

| # | 파일 | 신규/수정 | 내용 |
|---|---|---|---|
| 1 | `app/program/page.tsx` | 수정 | public builds 페치, 비교 섹션·자가진단 삽입 |
| 2 | `app/program/self-check.tsx` | 신규 | 5문항 자가진단(클라이언트, 비저장) |
| 3 | `app/alumni/archive/page.tsx` | 수정 | 기수(sessions.cohort_id 경유)·세션·영상·자료 페치 추가 |
| 4 | `app/alumni/archive/archive-view.tsx` | 수정 | 기존 브리프 섹션 아래 "녹화본·교재" 섹션 추가(기수 필터 재사용) |
| 5 | `app/admin/applications/actions.ts` | 수정 | `updateApplicationStatus`에 `notify()` 호출(T-02/T-03) |
| 6 | `app/apply/actions.ts` (또는 동등 제출 액션) | 수정 | 제출 시 T-01 발송 확인/추가 |

## 2. F1 — `/program` (SCR-01, US-01·02)

- **자가진단**: 5문항(코딩 경험/가용 시간/AX 상황/직접 만들 업무/역할), 결과 3구간(적극 추천/추천/상담 권장) + 지원 CTA. 응답 비저장.
- **Build 미리보기**: 서버에서 `builds.select().eq('visibility','public').order('created_at',{ascending:false}).limit(3)`. 0건이면 섹션 숨김.
- **비교 섹션**: 정적 3×4 표(축: 실습·CEO 의사결정·수료 후 지속 / 대상: 본 과정·최고위과정·플랫폼 강의·유튜브).
- 배치: 히어로 → 대상 → **자가진단** → 커리큘럼 → **Build 미리보기** → **비교** → 강사소개 → FAQ → 수강료 (prd-v30-remaining 사이클과 동일 순서, 검증된 패턴 재사용).

## 3. F2 — `/alumni/archive` (SCR-09, US-10)

- 확인됨(§0): `videos_read`/`materials_read` RLS가 이미 `is_enrolled(cohort_id) OR (is_published AND has_active_membership())`로 확장되어 있음 → **DB 변경 없음**.
- 페치: `sessions.select('id,cohort_id,week_no,title').eq('is_published',true).order('week_no')` → 세션 id로 `videos`, `materials` in() 조회 → `cohorts`로 기수명 조인.
- UI: 기존 `ArchiveView`(브리프 목록)의 코호트 필터(`COHORT_FILTERS`)를 재사용해 "녹화본·교재" 섹션을 병렬 추가. 진행 중 기수는 잠금 배지("종료 후 공개").
- 멤버십 만료 시: 기존 배너(만료 안내) 아래에서 영상·자료는 목록만 보이고 링크 비활성(잠금 아이콘) — 기존 브리프 섹션의 잠금 패턴과 동일 UX.

## 4. F3 — 알림톡 트리거 배선 (US-03, §9 T-01~03)

- `notify()` 엔진(기존)은 그대로 사용. `channel: "alimtalk"`는 현재도 no-op(콘솔 로그 + `notifications` insert, status='queued') — **이번 사이클은 실채널 연동이 아니라 호출 배선만** 한다.
- `updateApplicationStatus(id, status)`에서 상태 update 성공 후:
  - `status === 'accepted'` → `notify({channel:'alimtalk', templateCode:'T-02', to: app.phone, userId: null, body: T-02 문구, payload:{name, cohort}})`
  - `status === 'rejected' | 'waitlist'` → `templateCode:'T-03'`
  - 발송용 지원자 정보(`name`,`phone`)는 같은 update 호출에서 `.select()`로 함께 가져온다.
- 지원서 제출 액션에 T-01(접수) 호출이 없으면 추가. `/apply` 제출 서버 액션 확인 후 위치 결정.

## 5. 계약 (Contract)

- `notify()` 시그니처 변경 없음(기존 `NotifyInput` 재사용) — 호출부만 추가
- archive 페치는 read-only, 신규 테이블·컬럼 없음
- self-check·비교 섹션은 정적 데이터, API 없음
