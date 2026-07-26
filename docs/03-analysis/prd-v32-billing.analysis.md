# prd-v32-billing Analysis (PDCA Check)

- **Date**: 2026-07-23 · Design: `docs/02-design/features/prd-v32-billing.design.md`

## 실행한 게이트 (로컬 실행 가능)

| 게이트 | 결과 | 비고 |
|---|---|---|
| `tsc --noEmit` | ✅ pass | 변경 전/후 모두 0 에러 |
| `next build` | ✅ pass | 신규 라우트 7개 정상 컴파일: `/api/payments/{prepare,confirm,fail,reconcile}`, `/checkout{,/success,/fail}` |
| static gate-lint (FR-11/12·SEC-11) | ⚠ 2 pre-existing | 아래 참조 |

### static gate-lint 상세
- ✅ **내 신규 코드 전부 통과**: API route 4종(prepare·confirm·fail·reconcile)은 FR-12 권한검사 통과, checkout 페이지는 requireBillingAccess 게이트 보유, 클라이언트 코드 SERVICE_ROLE 미노출(SEC-11 pass).
- ⚠ 사전 존재(본 사이클 미변경, by-design public) 2건:
  - `app/api/applications/status/route.ts` — B-4 비로그인 매직링크 조회(email+phone 시크릿쌍을 `lookup_application_status`가 검증). 세션 authz가 없는 것이 설계 의도.
  - `app/alumni/[profileSlug]/page.tsx` — E-6/E-10 공개 프로필. 자체 주석 "하드 게이트 없음 — RLS가 비공개 행을 null로 필터". 설계 의도.
  - **판정**: 본 결제 사이클이 유발한 회귀 아님. 공개 라우트를 regex 만족용으로 훼손하지 않는다(recommended: 유지).

## 요구사항 커버리지 (PRD v3.2 델타)

| PRD | 요구 | 구현 | 상태 |
|---|---|---|---|
| §6.3 | payments 확장 컬럼(order_id UNIQUE·consent·requested_at·finalized_at·fail_*·confirmed_by·confirmed_at·match_ref·raw_confirm·idempotency_key) | 마이그레이션 alter table | ✅ |
| §6.3 | payment_events append-only 원장(requested\|approved\|failed\|reconciled\|canceled) | 테이블 + update/delete 차단 트리거 | ✅ |
| C-8 | Toss 결제창: prepare→confirm, 서버 금액대조·orderId 멱등·시크릿키 Basic+Idempotency-Key | `/api/payments/{prepare,confirm}` + `lib/billing/toss.ts` | ✅ |
| C-8 | 화면 '추후 추가'(PAYMENT_TOSS_ENABLED off 시 미노출) | `/checkout*`는 flag off면 `notFound()` | ✅ |
| R4 | 승인 전 서버 금액 대조·불일치 승인 금지 | confirm 라우트 + record/finalize RPC 이중 검증 | ✅ |
| R5 | orderId 멱등 | payments UNIQUE + Idempotency-Key + finalize 멱등 | ✅ |
| R8 | 공식 SDK만(결제위젯 제외) | v2 standard SDK 런타임 로드, 위젯 미사용 | ✅ |
| C-6·C-9 | 은행입금·스마트스토어 운영자 수동 확인 + match_ref·confirmed_by 기록 | `confirm_invoice_paid(uuid,text)` + Admin 패널(스마트스토어 확인·match_ref 입력) | ✅ |
| C-11 | 2단계 영속화(requested 선저장→종료 append) | record_payment_requested / finalize / fail + payment_events | ✅ |
| C-11 | 대사 리포트(미입금·부분/초과·고아 pending) | `reconcile_billing()` + Admin 대사 탭 + `/api/payments/reconcile` | ✅ |
| C-11 | 라이브 Toss 조회/거래대사 API 잡 | 라이브 키 발급 후 확장(스캐폴딩만) | ⏸ 의도적 보류 |

## 계약 보존(회귀 방지)
- BILL-005: 수동 입금확인 → invoices.paid·paid_at·enrollments.paid·outbox 발행 경로 유지(+payments/payment_events 추가는 additive).
- BILL-006: `confirm_invoice_paid`는 이미 paid면 결제 레코드 미생성(멱등) → paid_at·outbox 중복 없음.
- BILL-012: assistant 위임 조회·`request_tax_invoice`는 그대로. payments RLS admin-only 유지.

## 점수
- 로컬 실행 게이트(내 코드 기준): **build ✅ · tsc ✅ · gate(신규 4 route + 3 page) ✅ = 100%**.
- 사전 존재 by-design 위반 2건은 사이클 범위 밖(회귀 아님).
- 전체 E2E 하네스(163 케이스)의 실제 통과율은 스테이징 배포 + 시드 DB 필요 → Vercel 배포 후 팀 하네스로 측정.

## 후속(오픈 이슈)
1. 라이브 Toss 키 발급 → env 교체 + `PAYMENT_TOSS_ENABLED=on` + 실 조회/거래대사 잡 활성.
2. 마이그레이션 원격 적용(Supabase) — 배포 파이프라인/수동 apply.
3. BILL-007~010 xfail 케이스는 결제 서버 계약 구현으로 통과 전환 가능 → 하네스 선언 갱신은 스테이징 검증 후.
