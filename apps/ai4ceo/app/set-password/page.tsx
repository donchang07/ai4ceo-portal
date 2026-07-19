import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/db/auth";
import { SetPasswordView } from "./set-password-view";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { next } = await searchParams;
  return <SetPasswordView next={next ?? "/portal/cohort"} />;
}
