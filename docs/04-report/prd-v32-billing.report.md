# prd-v32-billing Report (PDCA Act)

- **Date**: 2026-07-23 · **Cycle**: prd-v32-billing · **PRD**: `docs/prd/prd-v3.2.md`
- **Branch**: `claude/github-connection-check-uw8nch`

## 한 일 (Summary)

PRD v3.2/v3.1의 결제(Billing) 델타를 처음부터 끝까지 구현했다. 현행 수동 결제 2종(은행입금·스마트스토어)을 P0 정식 경로로 확정하고, Toss 결제창은 테스트 키로 백엔드·대사·멱등까지 구현하되 사용자 화면은 `PAYMENT_TOSS_ENABLED` 플래그로 미노출(기본 off)했다. 네트워크/PC 단절 대비 payment_events append-only 원장과 2단계 영속화를 도입했다.

## 변경 파일

**신규**
- `apps/ai4ceo/supabase/migrations/20260723060000_prd_v32_billing.sql` — payments 확장 + payment_events 원장 + RPC 7종 + append-only 트리거 + RLS
- `apps/ai4ceo/lib/billing/toss.ts` — Toss confirm 호출(Basic+Idempotency-Key)·키/플래그
- `apps/ai4ceo/app/api/payments/prepare/route.ts` · `confirm/route.ts` · `fail/route.ts` · `reconcile/route.ts`
- `apps/ai4ceo/app/checkout/{page,checkout-view}.tsx` · `success/*` · `fail/*`
- PDCA 문서: `01-plan` · `02-design` · `03-analysis` · `04-report`

**수정**
- `app/api/admin/invoices/[id]/confirm/route.ts` — match_ref 전달
- `app/admin/billing/panel.tsx` — 스마트스토어 수동확인 + match_ref 입력 + 결제 대사 탭
- `lib/billing/provider.ts` — toss provider = flag 기반 checkout 안내
- `.env.local.example` — Toss 키·플래그

## 보안 절대규칙 준수
- **R4** 서버 금액 대조(프론트 금액 미신뢰, invoice.amount 서버 주입) — confirm 라우트 + RPC 이중.
- **R5** orderId 멱등(UNIQUE + Idempotency-Key + finalize 멱등).
- **R8** 공식 SDK만(결제위젯 제외).

## Check 결과
- `tsc` ✅ · `next build` ✅ · static gate(신규 4 route + 3 page) ✅ = 로컬 실행 게이트 100%.
- 사전 존재 by-design 공개 라우트 2건(applications/status, alumni/[profileSlug])은 사이클 범위 밖·회귀 아님.
- 전체 E2E 하네스(163)의 실제 통과율은 스테이징 배포 후 측정.

## 배포
- GitHub push + PR → Vercel 배포.
- **Go-live(운영 전환)**: 라이브 Toss 키 발급 시 env 키(test→live) 교체 + `PAYMENT_TOSS_ENABLED=on` 만으로 추가 개발 없이 결제 화면 노출.
- **DB**: 마이그레이션 `20260723060000_prd_v32_billing.sql`을 원격 Supabase에 적용 필요.
