// 02-access-control.md 전수 매트릭스를 파싱 가능한 데이터로 옮긴 것.
// 브라우저 스펙(matrix.access.spec.ts)과 리포트 히트맵(generate.mjs) 양쪽이 이 하나를 공유한다.
//
// expect 값 규칙:
//   "O"        → 리다이렉트 없이 해당 라우트에 그대로 머문다(접근 허용).
//   "/path"    → 게이트에 의해 최종적으로 해당 경로로 리다이렉트되어야 한다.
// 리다이렉트 체인의 "최종 착지 경로"를 기준으로 한다(예: alumniMember /admin → /portal/cohort → /portal/billing).

export const DEMO_SESSION_ID = "ed04829b-148e-4ae8-8462-cf80b41666db";

// 대시보드 행/열 라벨 및 실계정 매핑
export const ACCOUNTS = {
  admin: { email: "donchang0725@gmail.com", label: "admin", authed: true },
  student: { email: "donchang@hanmail.net", label: "재학생", authed: true },
  alumniMember: { email: "donchang0725@naver.com", label: "졸업+멤버십", authed: true },
  alumniNoMember: { email: "donchang@kaist.ac.kr", label: "졸업 미가입", authed: true },
  applicant: { email: "donchang0725@kakao.com", label: "관심자", authed: true },
  guest: { email: null, label: "비로그인", authed: false },
};

export const ROLE_ORDER = ["admin", "student", "alumniMember", "alumniNoMember", "applicant", "guest"];

// 대시보드 히트맵 열(주요 라우트)
export const ROUTES = {
  cohort: "/portal/cohort",
  chat: "/portal/chat",
  ai: "/portal/ai",
  assignments: "/portal/assignments",
  sessions: "/portal/sessions",
  sessionDetail: `/portal/sessions/${DEMO_SESSION_ID}`,
  files: "/portal/files",
  billing: "/portal/billing",
  alumni: "/alumni",
  membership: "/alumni/membership",
  admin: "/admin",
};

export const ROUTE_ORDER = [
  "cohort",
  "chat",
  "ai",
  "assignments",
  "sessions",
  "sessionDetail",
  "files",
  "billing",
  "alumni",
  "membership",
  "admin",
];

// 라우트 접근 시 로그인이 필요한지(비로그인 → /login) — guest 기대값 계산용
const AUTH_ROUTES = new Set(ROUTE_ORDER); // 모든 매트릭스 라우트는 인증 필요(공개 페이지는 별도)

// 각 계정 × 라우트 → 최종 착지 경로 기대값
export const MATRIX = {
  admin: {
    cohort: "O", chat: "O", ai: "O", assignments: "O",
    sessions: "O", sessionDetail: "O", files: "O", billing: "O",
    alumni: "O", membership: "O", admin: "O",
  },
  student: {
    cohort: "O", chat: "O", ai: "O", assignments: "O",
    sessions: "O", sessionDetail: "O", files: "O", billing: "O",
    alumni: "/portal/billing", membership: "/portal/billing", admin: "/portal/cohort",
  },
  alumniMember: {
    cohort: "/portal/billing", chat: "/portal/billing", ai: "/portal/billing", assignments: "/portal/billing",
    sessions: "O", sessionDetail: "O", files: "O", billing: "O",
    alumni: "O", membership: "O", admin: "/portal/billing",
  },
  alumniNoMember: {
    cohort: "/portal/billing", chat: "/portal/billing", ai: "/portal/billing", assignments: "/portal/billing",
    sessions: "/alumni/membership", sessionDetail: "/alumni/membership", files: "/alumni/membership", billing: "O",
    alumni: "O", membership: "O", admin: "/portal/billing",
  },
  applicant: {
    cohort: "/", chat: "/", ai: "/", assignments: "/",
    sessions: "/", sessionDetail: "/", files: "/", billing: "/apply",
    alumni: "/", membership: "/", admin: "/",
  },
  guest: {
    cohort: "/login", chat: "/login", ai: "/login", assignments: "/login",
    sessions: "/login", sessionDetail: "/login", files: "/login", billing: "/login",
    alumni: "/login", membership: "/login", admin: "/login",
  },
};

// 대시보드 히트맵 셀 상태 분류: 기대 결과 → 상태 종류
export function expectKind(expect) {
  if (expect === "O") return "allow"; // 녹
  if (expect === "/login") return "login"; // 중립
  return "redirect"; // 회색(리다이렉트)
}

// 매트릭스 셀 → 문서 개별 케이스 ID 매핑(02-access-control.md 개별 케이스 표 기준).
// 여기에 없는 셀은 매트릭스 파생 추가 커버리지(문서 개별 ID 없음)로, 리포트에 케이스로 집계되지 않는다.
export const CELL_CASE_ID = {
  "student|cohort": "AC-14",
  // 재학생 세션 상세 O → 강의자료 목록·영상 영역 노출(LMS-V09 영상 열람권한 / LMS-M04 자료 열람권한)
  "student|sessionDetail": "LMS-V09 LMS-M04",
  "student|alumni": "AC-16",
  "student|admin": "AC-17",
  "alumniMember|sessions": "AC-19",
  "alumniMember|chat": "AC-20",
  "alumniMember|ai": "AC-21",
  "alumniNoMember|sessions": "AC-23",
  // 졸업 미가입(kaist) 세션 상세 → /alumni/membership 리다이렉트, 영상 미노출(LMS-V10)
  "alumniNoMember|sessionDetail": "LMS-V10",
  "alumniNoMember|files": "AC-25",
  "alumniNoMember|alumni": "AC-26",
  "applicant|cohort": "AC-27",
  "applicant|billing": "AC-28",
  "guest|admin": "AC-30",
  "guest|sessionDetail": "AC-31",
};

export { AUTH_ROUTES };
