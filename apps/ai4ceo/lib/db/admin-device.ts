import { cookies, headers } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getSupabaseServer } from "./supabase-server";

// 관리자 기기 화이트리스트 — /admin/* 는 세션과 등록된 기기 쿠키를 모두 요구한다.
// 쿠키는 HttpOnly라 브라우저 JS로 읽을 수 없고, DB에는 해시만 저장한다.

export const ADMIN_DEVICE_COOKIE = "ai4ceo_admin_device";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년

export interface AdminDevice {
  id: string;
  label: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string | null;
}

// 기기 잠금 on/off. 사고 시 Vercel 환경변수만 바꿔 즉시 해제할 수 있도록 플래그로 둔다.
export function isAdminDeviceGuardEnabled(): boolean {
  return (process.env.ADMIN_DEVICE_GUARD ?? "").toLowerCase() === "on";
}

// 2단계 인증(TOTP) 강제 여부. 기본 off —
// 등록된 기기에서만 열리는 이상 TOTP는 기기 도난 시나리오만 추가로 막는데,
// 세션이 끊길 때마다 코드를 다시 물어 실사용 부담이 컸다.
// 다시 켜려면 ADMIN_MFA_REQUIRED=on. (등록해둔 인증 앱은 그대로 남아 바로 동작한다.)
export function isAdminMfaRequired(): boolean {
  return (process.env.ADMIN_MFA_REQUIRED ?? "").toLowerCase() === "on";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** 현재 요청의 쿠키가 이 관리자에게 등록된 기기인지 확인한다. */
export async function isRegisteredDevice(userId: string): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_DEVICE_COOKIE)?.value;
  if (!token) return false;

  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("admin_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("token_hash", hashToken(token))
      .is("revoked_at", null)
      .maybeSingle();
    if (!data) return false;

    await sb.from("admin_devices").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
    return true;
  } catch {
    // DB 조회 실패 시 통과시키지 않는다 (fail closed).
    return false;
  }
}

export async function listAdminDevices(userId: string): Promise<AdminDevice[]> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("admin_devices")
      .select("id, label, user_agent, created_at, last_seen_at")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    return (data as AdminDevice[] | null) ?? [];
  } catch {
    return [];
  }
}

/**
 * 등록 코드를 확인하고 현재 브라우저를 등록한다.
 * 서버 액션에서만 호출할 것 — 렌더링 중에는 쿠키를 쓸 수 없다.
 */
export async function registerCurrentDevice(
  userId: string,
  label: string,
  enrollCode: string,
): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.ADMIN_DEVICE_ENROLL_CODE ?? "";
  if (!expected) {
    return { ok: false, error: "등록 코드가 서버에 설정되어 있지 않습니다. (ADMIN_DEVICE_ENROLL_CODE)" };
  }
  if (!safeEqual(enrollCode.trim(), expected)) {
    return { ok: false, error: "등록 코드가 올바르지 않습니다." };
  }
  const trimmedLabel = label.trim();
  if (!trimmedLabel) return { ok: false, error: "기기 이름을 입력해 주세요." };

  const token = randomBytes(32).toString("base64url");
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  try {
    const sb = await getSupabaseServer();
    const { error } = await sb.from("admin_devices").insert({
      user_id: userId,
      token_hash: hashToken(token),
      label: trimmedLabel,
      user_agent: userAgent,
      last_seen_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "기기 등록에 실패했습니다." };
  }

  (await cookies()).set(ADMIN_DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return { ok: true };
}

export async function revokeAdminDevice(userId: string, deviceId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = await getSupabaseServer();
    const { error } = await sb
      .from("admin_devices")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", deviceId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "해지에 실패했습니다." };
  }
  return { ok: true };
}
