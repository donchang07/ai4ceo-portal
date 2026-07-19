import { NextRequest, NextResponse } from "next/server";

// QA 대시보드 접근 보호: basic-auth (env QA_DASHBOARD_USER / QA_DASHBOARD_PASSWORD, 기본 admin/uscdon00).
// TODO(후속): Supabase admin 로그인 연동으로 교체.
const USER = process.env.QA_DASHBOARD_USER || "admin";
const PASSWORD = process.env.QA_DASHBOARD_PASSWORD || "uscdon00";

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const idx = decoded.indexOf(":");
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (user === USER && pass === PASSWORD) {
        return NextResponse.next();
      }
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI4CEO QA Dashboard"' },
  });
}

export const config = {
  // 정적 자산 제외한 모든 경로 보호
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
