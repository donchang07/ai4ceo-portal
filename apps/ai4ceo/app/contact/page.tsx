import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { getCurrentUser } from "@/lib/db/auth";
import { SiteFooter } from "@/components/site-footer";
import { SectionTitle } from "@/components/ui";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "문의하기 · AI4CEO Portal",
  description: "AI4CEO 과정, 수강료, 동문 멤버십 관련 문의를 남겨주세요.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const from = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader user={user} />
      <main className="mx-auto max-w-[620px] px-6 py-10">
        <SectionTitle>문의하기</SectionTitle>
        <p className="mt-1 text-sm text-muted">
          과정·수강료·결제·동문 멤버십 등 궁금하신 내용을 남겨주시면 담당자가 확인 후 회신드립니다.
        </p>

        <div className="mt-6">
          <ContactForm source={from} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
