#!/usr/bin/env python3
"""AI4CEO Portal 공개 라우트 헬스체크.

의존성 없음(Python 3.8+ 표준 라이브러리만). Hermes/서버리스/VPS 어디서나 실행 가능.
- 각 라우트의 HTTP 상태·응답시간을 확인
- 랜딩(/)은 본문에 기대 문자열이 있는지까지 확인(빈/깨진 배포 탐지)
- 문제가 하나라도 있으면 종료코드 1 (cron/게이트웨이 경보 트리거용)

사용:
  python3 healthcheck.py            # 마크다운 요약
  python3 healthcheck.py --json     # 기계 판독용 JSON
환경변수:
  AI4CEO_BASE_URL (기본 https://ai4ceo-portal.vercel.app)
  AI4CEO_TIMEOUT  (초, 기본 15)
"""
import json
import os
import ssl
import sys
import time
import urllib.request
import urllib.error

BASE = os.environ.get("AI4CEO_BASE_URL", "https://ai4ceo-portal.vercel.app").rstrip("/")
TIMEOUT = float(os.environ.get("AI4CEO_TIMEOUT", "15"))
UA = "ai4ceo-portal-monitor/1.0 (+hermes-skill)"

# (path, 허용 상태코드 집합, 본문에 있어야 할 문자열 또는 None)
CHECKS = [
    ("/", {200}, "AI4CEO"),
    ("/program", {200}, None),
    ("/trends", {200}, None),
    ("/apply", {200}, None),
    ("/login", {200}, None),
]


def probe(path, ok_status, needle):
    url = BASE + path
    started = time.monotonic()
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
            status = resp.status
            body = resp.read(65536).decode("utf-8", "replace") if needle else ""
        ms = int((time.monotonic() - started) * 1000)
        status_ok = status in ok_status
        needle_ok = (needle is None) or (needle in body)
        ok = status_ok and needle_ok
        detail = ""
        if not status_ok:
            detail = f"예상 {sorted(ok_status)} != 실제 {status}"
        elif not needle_ok:
            detail = f"본문에 '{needle}' 없음(깨진 배포 의심)"
        return {"path": path, "status": status, "ms": ms, "ok": ok, "detail": detail}
    except urllib.error.HTTPError as e:
        ms = int((time.monotonic() - started) * 1000)
        # 5xx = critical, 그 외 4xx는 상태코드 규칙으로 판정
        ok = e.code in ok_status
        return {"path": path, "status": e.code, "ms": ms, "ok": ok,
                "detail": "" if ok else f"HTTP {e.code}"}
    except Exception as e:  # 타임아웃·DNS·연결거부 등 = critical
        ms = int((time.monotonic() - started) * 1000)
        return {"path": path, "status": None, "ms": ms, "ok": False,
                "detail": f"{type(e).__name__}: {e}"}


def main():
    results = [probe(p, s, n) for (p, s, n) in CHECKS]
    failed = [r for r in results if not r["ok"]]
    ok_count = len(results) - len(failed)
    summary = {
        "target": BASE,
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "ok": len(failed) == 0,
        "passed": ok_count,
        "total": len(results),
        "results": results,
    }

    if "--json" in sys.argv:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    else:
        head = "✅ 정상" if summary["ok"] else "🔴 이상 감지"
        print(f"# AI4CEO Portal 헬스체크 — {head}")
        print(f"대상: {BASE} · {summary['checked_at']} · {ok_count}/{len(results)} 통과\n")
        print("| 라우트 | 상태 | 응답(ms) | 판정 |")
        print("|---|---|---:|---|")
        for r in results:
            mark = "✅" if r["ok"] else "🔴"
            st = r["status"] if r["status"] is not None else "—"
            note = f" · {r['detail']}" if r["detail"] else ""
            print(f"| {r['path']} | {st} | {r['ms']} | {mark}{note} |")
        if failed:
            print("\n**경보:** " + "; ".join(
                f"{r['path']} → {r['detail'] or r['status']}" for r in failed))

    return 0 if summary["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
