// Design Ref: PRD 4.3 / 6.11 — PaymentProvider adapter.
// bank_transfer = real flow (invoice + account guide + admin manual paid).
// toss / smartstore = stubs (NO real card approval logic — never implemented).

import { BANK_ACCOUNT } from "../core/constants";

export type PaymentMethod = "bank_transfer" | "smartstore" | "toss";

export interface PaymentIntent {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
}

export interface PaymentInstruction {
  method: PaymentMethod;
  kind: "bank_account" | "external_link" | "unavailable";
  message: string;
  account?: typeof BANK_ACCOUNT;
  link?: string;
}

export interface PaymentProvider {
  method: PaymentMethod;
  createInstruction(intent: PaymentIntent): PaymentInstruction;
}

const bankTransferProvider: PaymentProvider = {
  method: "bank_transfer",
  createInstruction: () => ({
    method: "bank_transfer",
    kind: "bank_account",
    message: "아래 계좌로 입금해 주세요. 입금 확인은 운영자가 수동 대조 후 처리합니다.",
    account: BANK_ACCOUNT,
  }),
};

const smartstoreProvider: PaymentProvider = {
  method: "smartstore",
  // STUB — no real order execution
  createInstruction: () => ({
    method: "smartstore",
    kind: "external_link",
    message: "네이버 스마트스토어에서 결제를 진행해 주세요. (증빙은 스마트스토어가 처리)",
    link: "https://smartstore.naver.com/ai4ceo",
  }),
};

const tossProvider: PaymentProvider = {
  method: "toss",
  // STUB — Toss billing adapter interface only; card approval NOT implemented
  createInstruction: () => ({
    method: "toss",
    kind: "unavailable",
    message: "Toss Payments 연동은 준비 중입니다. (어댑터 스텁 — 실제 결제 미구현)",
  }),
};

const providers: Record<PaymentMethod, PaymentProvider> = {
  bank_transfer: bankTransferProvider,
  smartstore: smartstoreProvider,
  toss: tossProvider,
};

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return providers[method];
}
