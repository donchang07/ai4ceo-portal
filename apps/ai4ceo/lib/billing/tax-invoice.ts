// Design Ref: PRD 4.3(C-10) / 6.11 — TaxInvoiceProvider adapter.
// manual = default (simulation log only). popbill = mock mode (no real API key).

export type TaxProvider = "manual" | "popbill";

export const TAX_INVOICE_PROVIDER: TaxProvider =
  (process.env.TAX_INVOICE_PROVIDER as TaxProvider) || "manual";

export interface TaxInvoiceRequest {
  invoiceId: string;
  bizName: string;
  bizRegNo: string;
  amount: number;
}

export interface TaxInvoiceResult {
  provider: TaxProvider;
  status: "issued" | "requested" | "failed";
  mgtKey?: string;
  ntsConfirmNum?: string;
  simulated: boolean;
}

export function issueTaxInvoice(req: TaxInvoiceRequest): TaxInvoiceResult {
  const mgtKey = `MGT-${req.invoiceId}`;
  if (TAX_INVOICE_PROVIDER === "popbill") {
    // MOCK MODE — no real Popbill call; simulate issuance
    console.log(`[popbill:mock] 세금계산서 발행 시뮬레이션 mgtKey=${mgtKey} biz=${req.bizName}`);
    return { provider: "popbill", status: "issued", mgtKey, ntsConfirmNum: "MOCK-NTS-0001", simulated: true };
  }
  // manual — operator handles issuance; log only
  console.log(`[taxinvoice:manual] 발행 요청 접수 mgtKey=${mgtKey} biz=${req.bizName}`);
  return { provider: "manual", status: "requested", mgtKey, simulated: true };
}
