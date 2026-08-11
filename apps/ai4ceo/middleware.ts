import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_CONFIGURED } from "@/lib/db/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// 서버 컴포넌트가 신뢰하는 헤더 — 외부에서 넣어 보낸 값이 그대로 흘러가면 안 되므로
// 미들웨어가 매 요청마다 지우고 다시 세운다.
const TRUSTED_HEADERS = ["x-ai4ceo-user-id", "x-ai4ceo-user-email", "x-ai4ceo-path"];

// Design Ref: §5 — refresh Supabase auth session on each request
export async function middleware(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.next({ request });

  const refreshedCookies: CookieToSet[] = [];

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        // 갱신 토큰은 회전(rotation)되어 한 번 쓰면 폐기된다. 새 토큰을 요청 쿠키에도 반영하지
        // 않으면 같은 요청에서 렌더되는 서버 컴포넌트가 이미 폐기된 토큰을 읽고 갱신을 재시도해
        // 세션이 끊긴다. 그래서 요청·응답 양쪽에 쓴다.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        refreshedCookies.push(...cookiesToSet);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 헤더 복사는 쿠키 갱신 이후에 해야 갱신된 cookie 헤더가 함께 넘어간다.
  const requestHeaders = new Headers(request.headers);
  TRUSTED_HEADERS.forEach((h) => requestHeaders.delete(h));
  requestHeaders.set("x-ai4ceo-path", request.nextUrl.pathname);
  if (user) {
    requestHeaders.set("x-ai4ceo-user-id", user.id);
    requestHeaders.set("x-ai4ceo-user-email", user.email ?? "");
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  refreshedCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
