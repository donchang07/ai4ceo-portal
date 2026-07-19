import { FileDown, Newspaper, Ticket, Video, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AlumniShell } from "@/components/alumni-shell";
import { Button, Callout } from "@/components/ui";
import { requireAlumniAccess } from "@/lib/db/auth";
import { MEMBERSHIP_KRW, formatKRW } from "@/lib/core/constants";

const BENEFITS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Video, title: "전 기수 녹화본", desc: "모든 기수 세션 녹화본을 read-only로 열람합니다." },
  { icon: FileDown, title: "전 기수 교재 다운로드", desc: "누적된 강의 교재와 실습 자료를 내려받습니다." },
  { icon: Ticket, title: "AX 행사 무료 초대권", desc: "동문 대상 AX 세미나·네트워킹에 무료 초대됩니다." },
  { icon: Newspaper, title: "AI 피드 전체 열람", desc: "동문 전용 브리프와 AI 트렌드 피드를 모두 봅니다." },
];

export default async function AlumniMembershipPage() {
  await requireAlumniAccess();
  return (
    <AlumniShell>
      <div className="mx-auto w-full max-w-md pb-24">
        {/* 다크 멤버십 카드 */}
        <div className="rounded-[15px] bg-dark p-6 text-white">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-white/60">AI4CEO MEMBERSHIP</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
              이용 중
            </span>
          </div>
          <p className="mt-4 text-lg font-bold">대표님 · 17기 수료</p>
          <p className="text-sm text-white/60">만료까지 D-238</p>
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-2xl font-bold tnum">{formatKRW(MEMBERSHIP_KRW)}</p>
            <p className="text-xs text-white/50">연간 · VAT 포함</p>
          </div>
        </div>

        {/* 혜택 리스트 */}
        <ul className="mt-6 space-y-3">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <li
                key={b.title}
                className="flex items-start gap-3 rounded-[15px] border border-hairline bg-surface p-4"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-surface-muted text-primary">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{b.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{b.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* 제한 안내 */}
        <div className="mt-6">
          <Callout>
            <Lock size={16} className="mt-0.5 shrink-0" />
            <span>
              Zoom·대화방·과제·AI 조교는 재학생 전용입니다. 멤버십 만료 시 접근이 자동 회수됩니다.
            </span>
          </Callout>
        </div>
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto w-full max-w-md">
          <Button variant="primary" full href="/alumni/membership#renew">
            멤버십 갱신하기
          </Button>
        </div>
      </div>
    </AlumniShell>
  );
}
