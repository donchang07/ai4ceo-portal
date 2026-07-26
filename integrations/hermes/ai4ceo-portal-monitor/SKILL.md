---
name: ai4ceo-portal-monitor
description: >-
  AI4CEO Portal(https://ai4ceo-portal.vercel.app)의 상태를 점검하는 스킬. 공개 라우트
  헬스체크(가용성·응답시간·본문 검증), 최신 Vercel 프로덕션 배포 상태, (선택) Supabase
  결제 대사 요약을 수행하고 이상이 있으면 경보를 낸다. "포탈 상태 확인", "사이트 살아있나",
  "배포 상태", "ai4ceo 모니터링", 정기 점검/헬스체크/uptime 요청 시 사용한다. cron으로
  주기 실행(예: 매시간/매일 아침)하기에 적합하다.
---

# AI4CEO Portal Monitor

AI4CEO Portal의 운영 상태를 한 번에 점검하고, 문제가 있으면 사용자에게 알리는 스킬입니다.
개발(코드 수정·배포)은 하지 않습니다 — **관찰과 보고**만 합니다.

## 언제 쓰나
- 사용자가 "포탈 살아있어?", "사이트 상태", "배포 됐어?", "결제 대사 이상 없어?" 등을 물을 때
- cron 스케줄로 주기 점검할 때 (권장: 업무시간 매시간, 그 외 매일 아침 1회)

## 무엇을 점검하나 (우선순위 순)
1. **공개 라우트 헬스체크** — `scripts/healthcheck.py`
   - `/`, `/program`, `/trends`, `/apply`, `/login` 의 HTTP 상태·응답시간을 확인
   - 랜딩(`/`)은 본문에 `AI4CEO` 문자열이 있는지까지 확인(빈 배포/깨진 배포 탐지)
   - 5xx·타임아웃·예상외 상태·본문 누락은 **critical**
2. **Vercel 프로덕션 배포 상태** (선택) — `scripts/vercel_status.py`
   - 최신 production 배포의 `state`(READY/ERROR/BUILDING)·커밋 SHA·시각
   - `VERCEL_TOKEN` 미설정 시 자동 건너뜀
3. **Supabase 결제 대사 요약** (선택, 확장) — 아래 "확장" 참고
   - `reconcile_billing()` 결과(미입금·금액 불일치·고아 pending) 건수 요약

## 실행 방법
```bash
# 1) 핵심 헬스체크 (의존성 없음 — Python 표준 라이브러리만)
python3 scripts/healthcheck.py

# 2) Vercel 배포 상태 (환경변수 있을 때만)
python3 scripts/vercel_status.py
```
두 스크립트 모두 사람이 읽을 **마크다운 요약**을 stdout에 출력하고, 기계 판독용 **JSON**을
`--json` 플래그로 낼 수 있습니다. **문제가 있으면 종료코드 1**을 반환하므로, cron/게이트웨이에서
종료코드로 경보 여부를 판단할 수 있습니다.

## 보고 규칙 (에이전트 행동)
- 스크립트를 실행하고 그 출력을 **그대로 신뢰**한다(임의로 상태를 지어내지 않는다).
- **모두 정상**이면: 한 줄 요약만 보고한다. 예) "✅ 포탈 정상 · 5/5 라우트 200 · 최신 배포 READY".
- **이상이 있으면**: 무엇이·어떻게 실패했는지(라우트·상태코드·응답시간·배포 state)를 구체적으로 알리고,
  가능한 원인 가설을 덧붙인다. 개발 수정이 필요하면 **GitHub 이슈 생성을 제안**한다
  (직접 코드를 고치지 않는다 — 그건 개발 에이전트/Claude Code 리모트의 몫).
- 조용한 반복 점검에서 **변화가 없으면 사용자를 방해하지 않는다**(정상은 로그만).

## 환경변수 (config.example.env 참고)
| 변수 | 필수 | 용도 |
|---|---|---|
| `AI4CEO_BASE_URL` | 아니오 | 점검 대상 URL(기본 https://ai4ceo-portal.vercel.app) |
| `AI4CEO_TIMEOUT` | 아니오 | 요청 타임아웃(초, 기본 15) |
| `VERCEL_TOKEN` | 아니오 | Vercel 배포 상태 조회용 토큰 |
| `VERCEL_PROJECT_ID` | 아니오 | 기본 `prj_YHUfkb9n2MCnAOQqvizvlOUQoyf9` |
| `VERCEL_TEAM_ID` | 아니오 | 기본 `team_u20C861pddp8vaUbr4bJSsBI` |

## cron 예시 (Hermes 스케줄러)
- 업무시간 매시간: `0 9-19 * * 1-5` → healthcheck (+ vercel_status)
- 매일 아침 1회 종합: `0 8 * * *` → healthcheck + vercel_status + (확장) 결제 대사 요약

## 확장 — Supabase 결제 대사 (선택)
운영 DB의 결제 대사를 무인 점검하려면, service_role 키로 `reconcile_billing()` RPC를 호출하는
스크립트를 추가한다(민감 키가 필요하므로 신뢰 환경에서만). 결과 건수(미입금·부분/초과·고아 pending)를
요약해 보고하고, 0이 아니면 경보한다. 오늘 배포된 `reconcile_billing()`·`payment_events` 기반.

## 비목표
- 코드 수정·마이그레이션·배포는 하지 않는다. 문제 발견 시 이슈로 넘긴다.
- 인증이 필요한 라우트(/portal, /admin, /alumni)는 로그인 세션 없이 상태만 보지 않는다
  (리다이렉트 확인 정도. 자격증명 저장은 이 스킬 범위 밖).
