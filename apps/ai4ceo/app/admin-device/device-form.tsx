"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button, Callout, Input } from "@/components/ui";
import { enrollDevice } from "./actions";

export function DeviceForm({ registered }: { registered: boolean }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await enrollDevice(label, code).catch(() => null);
    if (result?.ok) {
      setDone(true);
      router.refresh();
    } else {
      setError(result?.error ?? "기기 등록에 실패했습니다.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-info-surface text-success">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-ink">이 기기가 등록되었습니다</h1>
        <p className="mt-2 text-sm text-muted">
          앞으로 1년간 이 브라우저에서는 추가 절차 없이 관리자 화면을 이용하실 수 있습니다.
        </p>
        <div className="mt-6">
          <Button href="/admin" variant="primary" full>
            관리자 화면으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-info-surface text-primary">
        <ShieldCheck size={22} />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">기기 등록</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        관리자 화면은 미리 등록한 기기에서만 열립니다. 이 브라우저를 등록하려면 등록 코드를 입력해 주세요.
      </p>

      {registered && (
        <Callout className="mt-4">
          이 계정에 등록된 기기가 이미 있습니다. 지금 보고 계신 브라우저는 아직 등록되지 않았습니다.
        </Callout>
      )}

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div>
          <label className="text-[13px] font-medium text-ink">기기 이름</label>
          <Input
            className="mt-1.5"
            required
            placeholder="예: 장동인 노트북"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-ink">등록 코드</label>
          <Input
            className="mt-1.5"
            required
            type="password"
            autoComplete="off"
            placeholder="등록 코드"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" variant="primary" full disabled={busy}>
          {busy ? "등록 중…" : "이 기기 등록"}
        </Button>
      </form>
    </>
  );
}
