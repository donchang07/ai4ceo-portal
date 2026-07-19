// 4.1 케이스 레지스트리 (타입 래퍼). 데이터 원본은 registry.mjs (node 리포트 생성기와 공유).
export type TestKind = "e2e" | "api" | "rls" | "action+db" | "static" | "rag" | "manual";
export interface TestImpl {
  kind: TestKind;
  spec: string;
}

// @ts-expect-error — .mjs 데이터 소스(타입 없음)
export { AUTOMATED, MANUAL, extractCaseIds } from "./registry.mjs";
