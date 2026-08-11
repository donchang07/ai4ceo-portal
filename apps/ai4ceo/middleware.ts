import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_CONFIGURED } from "@/lib/db/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Design Ref: §5 — refresh Supabase auth session on each request
export async function middleware(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) return NextResponse.next({ request });

  const requestHeaders = new Headers(request.headers);
  // 레이아웃(서버 컴포넌트)에서 현재 경로를 알아야 관리자 기기 등록·인증 화면을 가드에서 제외할 수 있다.
  requestHeaders.set("x-ai4ceo-path", request.nextUrl.pathname);
  const refreshedCookies: CookieToSet[] = [];

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        refreshedCookies.push(...cookiesToSet);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
