"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { registerCurrentDevice } from "@/lib/db/admin-device";

export async function enrollDevice(label: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return { ok: false, error: "관리자만 기기를 등록할 수 있습니다." };

  const result = await registerCurrentDevice(user.id, label, code);
  if (result.ok) revalidatePath("/admin-device");
  return result;
}
