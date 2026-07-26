#!/usr/bin/env python3
"""AI4CEO Portal의 최신 Vercel 프로덕션 배포 상태 조회 (선택 스크립트).

VERCEL_TOKEN 이 없으면 조용히 건너뛴다(종료코드 0). 의존성 없음(표준 라이브러리만).

사용:
  python3 vercel_status.py [--json]
환경변수:
  VERCEL_TOKEN       (필수 — 없으면 skip)
  VERCEL_PROJECT_ID  (기본 prj_YHUfkb9n2MCnAOQqvizvlOUQoyf9)
  VERCEL_TEAM_ID     (기본 team_u20C861pddp8vaUbr4bJSsBI)
"""
import json
import os
import sys
import ssl
import urllib.request
import urllib.error

TOKEN = os.environ.get("VERCEL_TOKEN", "").strip()
PROJECT = os.environ.get("VERCEL_PROJECT_ID", "prj_YHUfkb9n2MCnAOQqvizvlOUQoyf9")
TEAM = os.environ.get("VERCEL_TEAM_ID", "team_u20C861pddp8vaUbr4bJSsBI")

# READY = 정상. 그 외 상태별 판정.
GOOD = {"READY"}
BAD = {"ERROR", "CANCELED"}
PENDING = {"BUILDING", "QUEUED", "INITIALIZING"}


def main():
    if not TOKEN:
        print("ℹ️ VERCEL_TOKEN 미설정 — Vercel 배포 상태 점검 건너뜀.")
        return 0

    url = (f"https://api.vercel.com/v6/deployments?projectId={PROJECT}"
           f"&target=production&limit=1")
    if TEAM:
        url += f"&teamId={TEAM}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    try:
        with urllib.request.urlopen(req, timeout=15, context=ssl.create_default_context()) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"🔴 Vercel API 오류 HTTP {e.code} — 토큰/권한 확인 필요.")
        return 1
    except Exception as e:
        print(f"🔴 Vercel 조회 실패: {type(e).__name__}: {e}")
        return 1

    deps = data.get("deployments", [])
    if not deps:
        print("🔴 프로덕션 배포를 찾지 못함.")
        return 1
    d = deps[0]
    state = (d.get("state") or d.get("readyState") or "UNKNOWN").upper()
    meta = d.get("meta", {})
    sha = (meta.get("githubCommitSha") or "")[:7]
    msg = (meta.get("githubCommitMessage") or "").splitlines()[0][:60]
    ok = state in GOOD
    out = {
        "ok": ok, "state": state, "sha": sha, "commit": msg,
        "url": d.get("url"), "created": d.get("createdAt"),
    }
    if "--json" in sys.argv:
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        mark = "✅" if ok else ("🕐" if state in PENDING else "🔴")
        print(f"{mark} Vercel 프로덕션 배포: {state} · {sha} · {msg}")
    # BUILDING/QUEUED 는 경보 아님(정상 진행). ERROR/CANCELED/UNKNOWN 만 실패.
    return 0 if (ok or state in PENDING) else 1


if __name__ == "__main__":
    sys.exit(main())
