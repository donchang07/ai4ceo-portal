# PDCA Report — PRD v3.0 화면 구현 (SCR-01~09)

- 일자: 2026-07-21
- 입력: `PRD 화면 디자인 구현/design_handoff_ai4ceo_portal` (Claude Design 핸드오프, Apple 스타일) + PRD v3.0
- 대상 앱: `apps/ai4ceo` · Supabase 프로젝트 `olofwxsavfthsmmwjwzk`

## Plan — gap 분석

라이브 DB·앱 라우트를 핸드오프 9개 화면(SCR-01~09)과 대조:

| 화면 | 착수 전 상태 | 조치 |
|---|---|---|
| SCR-01 /program · SCR-02 /apply/status · SCR-04 /portal/ai · SCR-06 /portal/tasks | 실동작 존재 | 유지 |
| SCR-07 /portal/sessions/[id] | 존재(따라잡기 없음) | 체크리스트 보강 |
| SCR-03 /portal/billing | 목업 데이터 | 실데이터 배선 + 위임 |
| SCR-05 /portal/builds | 없음 | 신규 |
| SCR-08 /portal/roadmap | 없음 | 신규 |
| SCR-09 /alumni/archive | 앵커만 | 신규 라우트 |

DB: `builds.apply_status/effect_memo`, `roadmaps`, `session_catchups`, `enrollments.billing_delegate_email`, `memberships` 전부 라이브에 존재(마이그레이션 파일 누락 드리프트).

## Design 결정

- **시각 언어**: 포털 크롬·기존 6화면이 이미 자체 미니멀 시스템(`components/ui.tsx`)으로 일관 → 신규 화면도 동일 시스템으로 통일(Apple 토큰 별도 도입 시 사이드바와 충돌). 핸드오프의 정보구조·인터랙션·엣지케이스는 충실히 구현. 전면 Apple 리스킨은 후속 과제.
- **Archive 게이팅**: 만료자도 목록은 보여야 하므로 `requireAlumniAccess` + `hasActiveMembership`로 재생 게이팅(`requireArchiveAccess`는 만료자 차단이라 부적합).
- **결제 쓰기 보안**: `enrollments` blanket self-UPDATE는 `status` 조작 권한상승 위험 → 컬럼 제한 SECURITY DEFINER RPC(`set_billing_delegate`, `request_tax_invoice`).

## Do

- 신규: `app/portal/builds/*`, `app/portal/roadmap/*`, `app/alumni/archive/*`, `app/portal/sessions/[id]/session-catchup.tsx`
- 배선: `app/portal/billing/*`(실데이터+위임+세금계산서), 세션 페이지·nav 2종
- 스키마: `20260721000000_prd_v3_screens.sql`(드리프트 정합), `20260721010000_billing_rpcs.sql`(RPC 2종) — MCP로 idempotent 적용

## Check — 적대적 코드리뷰

초기 스코어 **61/100**. 빌드가 못 잡는 RLS·런타임 결함 6건:
1. billing 위임 UPDATE에 self-정책 없음 → 조용한 실패(RPC로 전환)
2. billing 세금계산서 INSERT 정책 없음 → 항상 실패(RPC로 전환)
3. builds load에 `user_id` 필터 누락 → 타인 public 결과물 노출·빈상태 오작동
4. billing `biz_name`에 이메일 오매핑(RPC 전환으로 제거)
5. roadmap Build 근거 피커 `user_id` 필터 누락
6. archive 유형 필터 영상/교재가 죽은 칩

## Act

6건 전부 수정. 재검증: `npx tsc --noEmit` 0 에러, `npm run build` 성공(32 라우트). 재스코어 ≥90.

## 검증 결과

- typecheck: pass · build: pass · 마이그레이션 2종 라이브 적용 성공

## 후속 과제 (미착수)

- 기존 6화면의 전면 Apple 비주얼 리스킨(현재는 정보구조·인터랙션만 반영)
- SCR-07 세션별 출석 판정(현재는 결석 여부 무관하게 따라잡기 상시 제공)
- SCR-09 영상/교재 콘텐츠 소스 배선(현재 posts 브리프만) · 기수 필터 실데이터
- 로드맵 PDF 내보내기(핸드오프 "확인 필요" 항목)
