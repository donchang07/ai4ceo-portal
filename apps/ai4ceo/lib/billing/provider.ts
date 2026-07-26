// Design Ref: PRD v3.2 4.3 / 6.11 — PaymentProvider adapter.
// bank_transfer·smartstore = 현행 P0(운영자 수동 입금확인).
// toss = 결제창 백엔드 구현 완료(테스트 키). 화면 진입점은 PAYMENT_TOSS_ENABLED 플래그로 노출.

import { BANK_ACCOUNT } from "../core/constants";
import { isTossCheckoutEnabled } from "./toss";

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
  // 결제창 백엔드(prepare→confirm·대사)는 테스트 키로 구현·검증 완료.
  // 화면 노출은 PAYMENT_TOSS_ENABLED(Go-live 시 on). off면 진입점 미노출.
  createInstruction: () =>
    isTossCheckoutEnabled()
      ? {
          method: "toss",
          kind: "external_link",
          message: "카드 결제(Toss)로 진행합니다.",
          link: "/checkout",
        }
      : {
          method: "toss",
          kind: "unavailable",
          message: "Toss 결제창은 라이브 키 발급 후 노출됩니다. (현재 은행입금·스마트스토어 이용)",
        },
};

const providers: Record<PaymentMethod, PaymentProvider> = {
  bank_transfer: bankTransferProvider,
  smartstore: smartstoreProvider,
  toss: tossProvider,
};

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return providers[method];
}
