import { GraduationCap, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui";

// Design Ref: prd-v3-cycle4.design.md §3

export interface CohortRow {
  id: string;
  name: string;
  recruit_start: string | null;
  recruit_end: string | null;
  edu_start: string | null;
  edu_end: string | null;
  capacity: number | null;
  status: string | null;
  enrolledCount: number;
}

const STATUS_TONE: Record<string, "progress" | "done" | "wait" | "neutral"> = {
  active: "progress",
  recruiting: "wait",
  completed: "done",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function CohortsTable({ rows }: { rows: CohortRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-muted">등록된 기수가 없습니다.</p>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-[15px] border border-hairline bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-xs text-muted">
            <th className="px-5 py-3 font-semibold">기수</th>
            <th className="px-5 py-3 font-semibold">모집 기간</th>
            <th className="px-5 py-3 font-semibold">교육 기간</th>
            <th className="px-5 py-3 font-semibold">등록 인원</th>
            <th className="px-5 py-3 font-semibold">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  <GraduationCap size={15} className="text-primary" />
                  {r.name}
                </div>
              </td>
              <td className="px-5 py-4 text-muted tnum">
                {fmtDate(r.recruit_start)} ~ {fmtDate(r.recruit_end)}
              </td>
              <td className="px-5 py-4 text-muted tnum">
                {fmtDate(r.edu_start)} ~ {fmtDate(r.edu_end)}
              </td>
              <td className="px-5 py-4 tnum">
                <span className="flex items-center gap-1.5 text-ink">
                  <Users size={14} className="text-muted" />
                  {r.enrolledCount}
                  {r.capacity != null ? ` / ${r.capacity}` : ""}
                </span>
              </td>
              <td className="px-5 py-4">
                <Badge tone={STATUS_TONE[r.status ?? ""] ?? "neutral"}>{r.status ?? "미정"}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
