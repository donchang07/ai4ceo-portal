# prd-v32-billing Plan (PDCA Plan)

- **Date**: 2026-07-23 · **PRD 정본**: `docs/prd/prd-v3.2.md` §4.3(C-6·C-8·C-9·C-11)·§6.3(데이터 모델)·§6.11(결제 시퀀스)·v3.1/v3.2 Changelog
- **선행 사이클**: prd-v30-final, prd-v3-cycle3~5 (main 반영 완료)
- **전제**: v3.0 대비 v3.2의 델타는 **결제(Billing) 도메인에 한정**된다. 공개/LMS/AI/Admin 화면은 이미 구현·검증됨. 본 사이클은 결제 백엔드 정합화만 다룬다.

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Toss 정식 API 지연으로 현행 수동 결제(은행입금·스마트스토어) 2종을 P0 정식 경로로 확정하고, Toss는 테스트 키로 구현·검증까지 완료해 라이브 키 발급 시 즉시 서비스 가능하게 준비한다. 네트워크/PC 단절 대비 결제 대사(2단계 영속화) 원장을 도입한다. |
| **WHO** | 합격자/수강생(결제) · 운영자(수동 입금확인·대사) · assistant(위임 조회) |
| **RISK** | Toss 라이브 키 미발급 — 실승인 불가. 테스트 키(test_ck/test_sk)로 구현·검증하고 사용자 결제 화면은 `PAYMENT_TOSS_ENABLED` 플래그로 미노출(기본 off). E2E 하네스는 배포 스테이징 + 시드 DB 필요(로컬 미실행). |
| **SUCCESS** | build+tsc+lint+static-gate 통과, Check ≥95%(로컬 실행 가능 게이트 기준), 지정 브랜치 push + PR + Vercel 배포 |
| **SCOPE** | F1 payments 컬럼 확장 + payment_events append-only 원장(6.3) · F2 Toss 결제창 백엔드(prepare→confirm, 서버 금액대조·orderId 멱등·Basic 인증) 테스트키 · F3 현행 수동 입금확인 2종(은행입금·스마트스토어) match_ref·confirmed_by 기록 · F4 결제 대사 리포트(미입금/부분입금/초과입금·고아 pending) |

## Features

| # | 내용 | 근거(PRD) |
|---|---|---|
| F1 | `payments`에 order_id(UNIQUE)·idempotency_key·consent·consent_at·requested_at·finalized_at·fail_code·fail_message·confirmed_by·confirmed_at·match_ref·raw_confirm 추가. 신규 `payment_events`(append-only 원장: requested\|approved\|failed\|reconciled\|canceled) 테이블 | §6.3, C-11 |
| F2 | Toss 결제창 일반결제 백엔드: `POST /api/payments/prepare`(약관동의+orderId→pending) → SDK requestPayment → successUrl → `POST /api/payments/confirm`(서버 금액대조·orderId 멱등·시크릿키 Basic+Idempotency-Key). 화면(`/checkout`)은 `PAYMENT_TOSS_ENABLED` off 시 미노출 | C-8, §6.11, R4·R5·R8 |
| F3 | 현행 수동 입금확인 2종 확정: 은행입금(bank_transfer)·스마트스토어(smartstore) 모두 운영자 수동 확인. `confirm_invoice_paid`가 payments(approved, provider, match_ref, confirmed_by, confirmed_at) + payment_events(approved, source=admin) 기록. Admin 패널에 스마트스토어 확인 + match_ref 입력 추가 | C-6, C-9 |
| F4 | 결제 대사: `reconcile_billing()` RPC — issued인데 승인 결제 없음(미입금)·금액 불일치(부분/초과)·requested 15분 경과 pending(고아) 리포트. Admin 대사 탭 + `/api/payments/reconcile` | C-11, §6.11 R3·R4 |

## 사전 결정 (질문 없이 진행 — 사용자 지시: recommended 선택)

| # | 결정 | 근거 |
|---|---|---|
| D-1 | 학생 트리거 결제 쓰기는 **SECURITY DEFINER RPC**로만 허용(payments RLS는 admin-only 유지). record_payment_requested / finalize_payment_confirmed / fail_payment. blanket self-write 금지 | 기존 billing_rpcs.sql 패턴 승계, RLS 우회 탈취 방지 |
| D-2 | Toss 연동은 **API 개별 연동 키(test_ck/test_sk)** 만, 결제위젯 제외. 약관동의는 `/checkout`이 수집·payments.consent 저장 | v3.1 Changelog, R8 |
| D-3 | 결제 화면 진입점(`/checkout`)은 `PAYMENT_TOSS_ENABLED !== "on"`이면 `notFound()`로 미노출(기본 off). 라이브 전환은 env 키 교체 + 플래그만 | C-8 "화면 추후 추가", Go-live |
| D-4 | payment_events는 update/delete 차단 트리거로 append-only 강제 | C-11 "원장은 삭제·수정하지 않음" |
| D-5 | 미완결 대사의 실제 Toss 조회/거래대사 API 호출은 라이브 키 발급 후 활성. 지금은 대사 **리포트**(DB 기준)와 route 스캐폴딩까지 구현 | C-11, RISK |
| D-6 | `confirm_invoice_paid`는 하위호환 유지 + `(uuid, text match_ref)` 오버로드 추가. Admin route는 match_ref 전달 | BILL-005/006 계약 보존 |

## Success Criteria

- **SC-1**: 마이그레이션 적용 시 payments 확장 컬럼 + payment_events 원장 생성, append-only 강제
- **SC-2**: `/api/payments/prepare`·`/api/payments/confirm`이 서버 금액대조·orderId 멱등을 강제(금액 변조/중복 orderId 차단)
- **SC-3**: Admin 수동 입금확인이 은행입금·스마트스토어 모두 payments+payment_events+invoice.paid+enrollment.paid로 영속(BILL-005 계약 유지, BILL-006 멱등)
- **SC-4**: 대사 리포트가 미입금·불일치·고아 pending을 식별
- **SC-5**: build+tsc+lint+static-gate 100% 통과 → Check ≥95%
- **SC-6**: 지정 브랜치 push + PR + Vercel 배포
