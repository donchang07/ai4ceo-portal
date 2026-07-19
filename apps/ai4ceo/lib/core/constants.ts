// Design Ref: 18기 공식 모집 안내(CEO를 위한 AI코딩스쿨(18기).docx) 기준 — 개강 2026-09-09(수) 18:00
// Zoom 온라인 강의라 정원 상한을 두지 않음(capacity: null)

export const COHORT_18 = {
  id: "00000000-0000-0000-0000-0000000000c1",
  name: "18기",
  eduStart: "2026-09-09T18:00:00+09:00", // 수 18:00 개강
  eduStartLabel: "2026년 9월 9일(수) 18:00",
  eduEnd: "2026-11-11T21:00:00+09:00",
  recruitEnd: "2026-09-02",
  capacity: null as number | null, // Zoom 강의 — 정원 제한 없음
  versionLabel: "v18",
} as const;

// 금액 (VAT 포함)
export const TUITION_KRW = 2_200_000;
export const MEMBERSHIP_KRW = 550_000;

export const BANK_ACCOUNT = {
  bank: "신한은행",
  number: "140-012-546787",
  holder: "에이아이비비랩 주식회사",
} as const;

export function formatKRW(v: number): string {
  return v.toLocaleString("ko-KR") + "원";
}

// 4대 트랙
export const TRACKS = [
  { key: "claude_code", name: "Claude Code", icon: "terminal", desc: "터미널 기반 AI 코딩·디버깅, CLAUDE.md·스킬 작성, 에이전트 위임" },
  { key: "claude_design", name: "Claude Design", icon: "layout", desc: "프로토타입·랜딩·슬라이드, Vercel·Supabase 연동 웹 UI 챗봇" },
  { key: "claude_cowork", name: "Claude Cowork", icon: "users", desc: "문서·리서치·분석 지식노동 위임, 반복 업무 워크플로 자동화" },
  { key: "harness", name: "Harness Engineering", icon: "settings", desc: "에이전트 하네스 설계 — 도구·권한·가드레일, 메모리, Eval 루프" },
] as const;

export const ADMIN_EMAIL = "donchang0725@gmail.com";
