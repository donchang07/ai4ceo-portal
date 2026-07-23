"use server";

import { revalidatePath } from "next/cache";
import { requireAlumniAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";

// Design Ref: prd-v3-cycle5.design.md §3 — E-6. 본인 alumni_profiles 1행 upsert.

export interface AlumniProfileInput {
  display_name: string;
  job_title: string;
  company_name: string;
  bio: string;
  expertise: string;
  company_description: string;
  homepage_url: string;
  contact_interest: string;
  contact_email: string;
  show_contact: boolean;
  public_message: string;
  cohort_label: string;
  visibility: "private" | "alumni_only" | "public";
}

export async function saveAlumniProfile(input: AlumniProfileInput) {
  const user = await requireAlumniAccess();
  const sb = await getSupabaseServer();
  const { error } = await sb.from("alumni_profiles").upsert(
    {
      user_id: user.id,
      ...input,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/alumni/profile");
  revalidatePath("/alumni/directory");
  return { ok: true as const };
}
