"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { revokeAdminDevice } from "@/lib/db/admin-device";

export async function revokeDevice(deviceId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return { ok: false, error: "권한이 없습니다." };

  const result = await revokeAdminDevice(user.id, deviceId);
  if (result.ok) revalidatePath("/admin/security");
  return result;
}
