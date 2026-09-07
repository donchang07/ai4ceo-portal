import { AdminShell } from "@/components/admin-shell";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { getReferralStats } from "@/lib/db/queries";

// Design Ref: PRD §7.2 /admin/referrals — 추천 코드·성과 (모듈 J 추천·성장)
export default async function AdminReferralsPage() {
  const stats = await getReferralStats();
  const totalApplications = stats.reduce((sum, s) => sum + s.applications, 0);
  const totalAccepted = stats.reduce((sum, s) => sum + s.accepted, 0);

  return (
    <AdminShell>
      <SectionTitle>추천 코드·성과</SectionTitle>
      <p className="mt-1 text-sm text-muted">
        지원서에 입력된 추천 코드를 기준으로 코드별 유입과 합격 전환을 집계합니다.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-muted">등록된 추천 코드</div>
          <div className="mt-1 text-2xl font-bold">{stats.length}개</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">추천 경유 지원</div>
          <div className="mt-1 text-2xl font-bold">{totalApplications}건</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">추천 경유 합격</div>
          <div className="mt-1 text-2xl font-bold">{totalAccepted}건</div>
        </Card>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-medium">코드</th>
              <th className="py-2 pr-4 font-medium">추천인</th>
              <th className="py-2 pr-4 font-medium">지원</th>
              <th className="py-2 pr-4 font-medium">합격</th>
              <th className="py-2 font-medium">전환율</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.code} className="border-b border-line/60">
                <td className="py-2.5 pr-4 font-mono font-medium">{s.code}</td>
                <td className="py-2.5 pr-4">{s.label ?? "—"}</td>
                <td className="py-2.5 pr-4">{s.applications}</td>
                <td className="py-2.5 pr-4">{s.accepted}</td>
                <td className="py-2.5">
                  {s.applications > 0 ? (
                    <Badge tone={s.accepted > 0 ? "done" : "wait"}>
                      {Math.round((s.accepted / s.applications) * 100)}%
                    </Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stats.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">등록된 추천 코드가 없습니다.</p>
        )}
      </div>
    </AdminShell>
  );
}
