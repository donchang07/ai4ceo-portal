# prd-v32-billing Design (PDCA Design)

- **Date**: 2026-07-23 · Plan: `docs/01-plan/features/prd-v32-billing.plan.md`

## 1. 데이터 모델 (PRD §6.3)

### 1.1 `payments` 확장 컬럼
```
order_id text UNIQUE, idempotency_key text, consent jsonb, consent_at timestamptz,
requested_at timestamptz, finalized_at timestamptz, fail_code text, fail_message text,
confirmed_by uuid → profiles(id), confirmed_at timestamptz, match_ref text, raw_confirm jsonb
```

### 1.2 `payment_events` (append-only 원장, C-11)
```
id uuid pk, order_id text, payment_key text,
event_type payment_event_type = requested|approved|failed|reconciled|canceled,
amount int, raw jsonb, source payment_event_source = server|reconciler|webhook|admin,
created_at timestamptz default now()
```
- RLS: admin select. INSERT는 SECURITY DEFINER RPC 경유. UPDATE/DELETE는 트리거 `raise exception`로 차단(append-only).

## 2. RPC (SECURITY DEFINER)

| 함수 | 권한 | 역할 |
|---|---|---|
| `record_payment_requested(invoice_id, provider, order_id, amount, consent)` | authenticated(본인 invoice/위임/admin) | payments(pending, order_id, requested_at, consent, consent_at) + payment_events(requested, server). order_id 멱등(존재 시 기존 반환) |
| `finalize_payment_confirmed(order_id, payment_key, amount, raw)` | authenticated(order 소유자) | **금액 대조**(payments.amount ≠ amount → 예외). status=approved, provider_payment_key, approved_at, finalized_at, raw_confirm + payment_events(approved, server) + invoices.paid + enrollments.paid |
| `fail_payment(order_id, fail_code, fail_message, raw)` | authenticated(order 소유자) | status=failed, fail_code, fail_message, finalized_at + payment_events(failed, server) |
| `confirm_invoice_paid(invoice_id)` / `(invoice_id, match_ref)` | admin | 수동 확인. invoice 미paid일 때만 payments(approved, provider=invoice.method, match_ref, confirmed_by, confirmed_at, finalized_at) + payment_events(approved, admin) 기록 후 invoices.paid + enrollments.paid. 멱등 |
| `reconcile_billing()` | admin | (a) issued & 승인결제 없음=미입금 (b) 승인금액≠invoice.amount=불일치 (c) pending & requested_at<now()-15m=고아 |

## 3. Toss 결제창 시퀀스 (C-8, §6.11)

```
/checkout (flag on) → 약관동의 수집
 → POST /api/payments/prepare {invoiceId, consent}
     · 서버: invoice.amount 조회(프론트 금액 미신뢰) → orderId 생성 → record_payment_requested
     · 응답 {orderId, amount, clientKey}
 → SDK loadTossPayments(clientKey).payment().requestPayment({method,amount,orderId,successUrl,failUrl})
 → successUrl?paymentKey&orderId&amount → POST /api/payments/confirm
     · 서버 금액 대조: payments.amount(=invoice.amount) ≠ 요청 amount → 승인 호출 금지, fail
     · orderId 멱등: 이미 approved면 기존 결과 반환
     · POST https://api.tosspayments.com/v1/payments/confirm
         Authorization: Basic base64(secretKey:) · Idempotency-Key: orderId
     · 200 → finalize_payment_confirmed → paid
     · !200 → fail_payment(fail_code)
 → failUrl?code&message → fail_payment
```

### 보안 절대규칙
- **R4**: 승인 전 서버 금액 대조. 프론트 amount 하드코딩 금지, invoice.amount 서버 주입.
- **R5**: orderId 멱등(UNIQUE + Idempotency-Key).
- **R8**: 공식 SDK만, 결제창 UI 자체제작 금지. 결제위젯 제외(API 개별 연동 키).

## 4. 파일 변경

| 파일 | 변경 |
|---|---|
| `supabase/migrations/20260723060000_prd_v32_billing.sql` | 신규: 스키마+RPC+RLS+append-only 트리거 |
| `lib/billing/toss.ts` | 신규: confirm 호출, 키/플래그, test-key 감지 |
| `lib/billing/reconcile.ts` | 신규: 대사 리포트 타입 |
| `app/api/payments/prepare/route.ts` | 신규 |
| `app/api/payments/confirm/route.ts` | 신규 |
| `app/api/payments/reconcile/route.ts` | 신규(admin) |
| `app/checkout/page.tsx` + `checkout-view.tsx` | 신규(플래그 gate) |
| `app/admin/invoices/[id]/confirm/route.ts` | match_ref 전달 |
| `app/admin/billing/panel.tsx` | 스마트스토어 확인 + match_ref + 대사 탭 |
| `lib/billing/provider.ts` | toss provider = test-key checkout 안내 |
| `lib/db/types.ts`, `lib/db/mock.ts` | 타입 확장 |
| `.env.local.example` | Toss 키·플래그 |

## 5. 비목표 (Non-goals)
- 라이브 결제 실승인(키 미발급) · 결제위젯 · pg_cron 실 Toss 조회(라이브 후) · webhook 수신(후속)
