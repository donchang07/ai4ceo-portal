# ai4ceo-portal-monitor (Hermes 스킬)

AI4CEO Portal(https://ai4ceo-portal.vercel.app)의 상태를 무인 점검하는 [Hermes Agent](https://github.com/nousresearch/hermes-agent) 스킬입니다.
agentskills.io 표준 포맷(`SKILL.md` + `scripts/`)이라 다른 에이전트에서도 재사용할 수 있습니다.

**역할 분담**: 이 스킬은 *관찰·보고*만 합니다. 코드 수정·배포는 하지 않고, 문제를 찾으면
GitHub 이슈로 넘겨 개발 에이전트(Claude Code 리모트)가 처리하도록 합니다.

## 구성
```
ai4ceo-portal-monitor/
├─ SKILL.md              # 스킬 정의(트리거·행동 규칙)
├─ scripts/
│  ├─ healthcheck.py     # 공개 라우트 가용성·응답시간·본문 검증 (의존성 없음)
│  └─ vercel_status.py   # 최신 프로덕션 배포 상태 (VERCEL_TOKEN 있을 때)
├─ config.example.env    # 환경변수 예시
└─ README.md
```

## 빠른 시작
```bash
# 1) Hermes 스킬 디렉토리에 복사 (경로는 Hermes 설정에 따름)
cp -r integrations/hermes/ai4ceo-portal-monitor ~/.hermes/skills/

# 2) (선택) 환경변수 설정
cp config.example.env .env   # VERCEL_TOKEN 등 채우기

# 3) 단독 실행 테스트 — 의존성 설치 불필요
python3 scripts/healthcheck.py
python3 scripts/vercel_status.py
```

`healthcheck.py`는 표준 라이브러리만 쓰므로 `pip install` 없이 어디서나 돕니다.
문제가 있으면 **종료코드 1**을 반환하므로 cron/게이트웨이가 경보 여부를 종료코드로 판단할 수 있습니다.

## Hermes에서 스케줄(cron) 등록
Hermes 내장 스케줄러로 주기 실행합니다(대화에서 자연어로 지시하거나 cron 표현식으로):
- 업무시간 매시간: `0 9-19 * * 1-5` — healthcheck (+ vercel_status)
- 매일 아침 종합: `0 8 * * *` — healthcheck + vercel_status

정상이면 조용히 로그만 남기고, 이상 시에만 연결된 채널(Slack/Telegram/이메일)로 보고하도록
`SKILL.md`의 "보고 규칙"이 지시합니다.

## 두 에이전트 연결(권장 패턴)
1. Hermes가 이상 감지 → 요약과 함께 **GitHub 이슈 생성**
2. Claude Code 리모트가 그 이슈를 받아 **원인 수정 → PR → 배포**
3. Hermes가 다음 점검에서 복구 확인

즉 Hermes = 감시·판단·지시, Claude Code 리모트 = 구현·배포.

## 네트워크(프록시) 참고
`healthcheck.py`는 `urllib`을 쓰며 표준 `HTTP_PROXY`/`HTTPS_PROXY` 환경변수를 자동으로 존중합니다.
사내/서버리스 등 프록시 환경에서도 해당 변수만 설정하면 동작합니다. (일부 격리 샌드박스는
아웃바운드를 막아 403이 날 수 있는데, 이는 스크립트가 아니라 그 환경의 프록시 정책 때문입니다.
실제 Hermes 호스트(VPS/서버리스)에서는 정상 동작합니다.)

## 확장 아이디어
- Supabase `reconcile_billing()` 정기 호출로 미입금·불일치·고아 pending 요약(service_role 키 필요)
- 응답시간 임계값 초과 시 경보(성능 저하 조기 감지)
- 특정 라우트의 핵심 문구 존재 검증 추가(예: `/program`에 커리큘럼 표)
