import { AdminShell } from "@/components/admin-shell";
import { Badge, Card, SectionTitle, type Tone } from "@/components/ui";
import { getNotificationLogs, getOutboxEvents } from "@/lib/db/queries";

// Design Ref: PRD §7.2 /admin/notifications — 알림 로그 (모듈 G 알림 엔진)
const CHANNEL_LABEL: Record<string, string> = {
  alimtalk: "알림톡",
  email: "이메일",
  sms: "문자",
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
  queued: { label: "발송 대기", tone: "wait" },
  sent: { label: "발송 완료", tone: "done" },
  failed: { label: "발송 실패", tone: "danger" },
};

function formatAt(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminNotificationsPage() {
  const [logs, outbox] = await Promise.all([getNotificationLogs(), getOutboxEvents()]);
  const failed = logs.filter((l) => l.status === "failed").length;
  const queued = logs.filter((l) => l.status === "queued").length;

  return (
    <AdminShell>
      <div className="flex items-center gap-3">
        <SectionTitle>알림 로그</SectionTitle>
        {failed > 0 && <Badge tone="danger">실패 {failed}건</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted">
        알림톡·이메일·문자 발송 내역과, 결제 확정처럼 사건으로 예약된 발송 대기열을 함께 확인합니다.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-muted">전체 발송</div>
          <div className="mt-1 text-2xl font-bold">{logs.length}건</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">발송 대기</div>
          <div className="mt-1 text-2xl font-bold">{queued}건</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">사건 대기열</div>
          <div className="mt-1 text-2xl font-bold">{outbox.length}건</div>
        </Card>
      </div>

      <h2 className="mt-8 text-base font-semibold">발송 내역</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-medium">채널</th>
              <th className="py-2 pr-4 font-medium">템플릿</th>
              <th className="py-2 pr-4 font-medium">수신</th>
              <th className="py-2 pr-4 font-medium">상태</th>
              <th className="py-2 font-medium">발송 시각</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const s = STATUS[l.status] ?? STATUS.queued;
              return (
                <tr key={l.id} className="border-b border-line/60">
                  <td className="py-2.5 pr-4">{CHANNEL_LABEL[l.channel] ?? l.channel}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{l.template_code ?? "—"}</td>
                  <td className="py-2.5 pr-4">{l.phone ?? "—"}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </td>
                  <td className="py-2.5">{formatAt(l.sent_at ?? l.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">발송된 알림이 없습니다.</p>
        )}
      </div>

      <h2 className="mt-8 text-base font-semibold">사건 대기열</h2>
      <p className="mt-1 text-sm text-muted">
        입금 확정 같은 사건이 생기면 여기에 한 건만 쌓이고, 같은 사건이 반복돼도 중복 발송되지 않습니다.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-medium">대상</th>
              <th className="py-2 pr-4 font-medium">사건</th>
              <th className="py-2 pr-4 font-medium">상태</th>
              <th className="py-2 font-medium">기록 시각</th>
            </tr>
          </thead>
          <tbody>
            {outbox.map((o) => {
              const s = STATUS[o.status] ?? STATUS.queued;
              return (
                <tr key={o.id} className="border-b border-line/60">
                  <td className="py-2.5 pr-4">{o.entity_type}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{o.event_type}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </td>
                  <td className="py-2.5">{formatAt(o.sent_at ?? o.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {outbox.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">대기 중인 사건이 없습니다.</p>
        )}
      </div>
    </AdminShell>
  );
}
