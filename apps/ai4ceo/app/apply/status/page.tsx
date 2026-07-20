import type { Metadata } from "next";
import { ApplyStatusView } from "./status-view";

export const metadata: Metadata = { title: "지원 상태 조회 — AI4CEO" };

// Design Ref: §5.1 — 공개 화면(가드 없음). 조회는 security definer RPC로만 수행
export default function ApplyStatusPage() {
  return <ApplyStatusView />;
}
