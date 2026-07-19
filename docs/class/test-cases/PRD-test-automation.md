# PRD — AI4CEO Portal 비즈니스 테스트 자동화 & 리포트 도구

문서 버전 v0.2 · 갱신일 2026-07-19 · 대상: `apps/ai4ceo`

> **v0.2 변경**: LMS 세션 케이스(08) 반영. 핵심 목표를 명확화 — 이 PRD를 구현하면
> **이 디렉토리(01~08)의 케이스를 그대로 실행하고, 케이스 ID별 pass/fail 리포트를 생성**한다.
> 즉 케이스 문서가 곧 테스트 명세이고, 도구는 그것을 "돌리고 채점"한다.

## 1. 배경 & 문제

이 포탈의 매출 방어선은 **역할·수강상태별 화면 차등**이다(졸업생 멤버십, 재학생 전용 AI 조교/대화방,
LMS 세션 접근 등). 수동 검증(02번 42셀 매트릭스, 08번 42 LMS 케이스)은 배포마다 반복 불가능하고,
페이지를 추가할 때 게이트 호출을 빠뜨리면 조용히 뚫린다. 또한 화면 상당수가 아직 목업/부분구현이라
"무엇이 진짜 동작하는가"가 배포마다 바뀐다.

→ 도구는 두 가지를 동시에 한다: **(A) 회귀 방지**(P0 보안·돈 룰이 깨지면 배포 차단),
**(B) 구현 진척 리포트**(⚠ 목업이 ✅ 실동작으로 바뀌는 추이 추적).

## 2. 목표 (Success Criteria) — "돌리고 리포트한다"

- **SC-1 (실행 가능)**: `npm run test:all` 한 번으로 01~08의 자동화 대상 케이스가 실제 프로덕션/프리뷰
  환경에 대해 실행된다.
- **SC-2 (케이스 ID 매핑)**: 모든 자동 테스트는 문서의 케이스 ID(예: `AC-19`, `LMS-A03`)를 태그로 달고,
  리포트가 **케이스 ID별 결과**를 보고한다.
- **SC-3 (리포트 생성)**: 실행 후 `docs/class/test-cases/reports/`에 마크다운+JSON 리포트가 생성된다.
  리포트는 각 케이스의 **선언 상태(문서의 ✅/⚠/❓ + 우선순위)** vs **실제 결과(pass/fail/skip)** 를 대조한다.
- **SC-4 (교차 검증)**: 리포트가 다음을 자동 분류한다 —
  - 🔴 **회귀**: 문서 ✅인데 실패 → 배포 차단 사유.
  - 🟢 **신규 통과**: 문서 ⚠(목업)인데 통과 → "문서 상태를 ✅로 갱신하세요" 알림.
  - ⚪ **예상된 미구현**: 문서 ⚠인데 실패(xfail) → 정상, 진척 카운트에만 반영.
  - 🟡 **미검증→검증됨**: 문서 ❓인데 결과 확정.
- **SC-5 (게이트 정적 검사)**: 새 `/portal`·`/alumni` 페이지가 `require*Access` 없이 추가되면 실패.
- **SC-6 (성능/게이트)**: 전체 5분 내, PR마다 CI 실행, P0 회귀 시 exit 1.

## 3. 범위

포함: 접근 매트릭스 E2E(02), 인증 플로우(01), AI/RAG 권한·스모크(03), 관리자 서버액션(04),
결제 어댑터 상태 점검(05), 공개/지원(06), RLS/API 직접공격(07), **LMS 세션 영상·자료·Q&A(08)**,
정적 게이트 린트, 케이스 파서 + 리포트 생성기, 계정/데이터 프로비저닝.
제외: 시각 회귀(픽셀), 부하 테스트, 결제사 실연동(키 확보 후), 영상 seek의 프레임 단위 정확성(스모크만).

## 4. 케이스 문서 ↔ 자동화 매핑 (핵심 설계)

케이스 문서의 표는 **파싱 가능한 명세**다. 각 행은 `| ID | 시나리오 | ... | 우선순위 | 상태 |` 형식이며,
ID·우선순위·상태 컬럼을 추출한다.

### 4.1 케이스 레지스트리
`tests/registry.ts`가 케이스 ID → 자동 테스트 구현을 잇는다.
```ts
// 예시
export const registry: Record<string, TestImpl> = {
  "AC-19": { kind: "e2e",      run: accessCell("naver", "/portal/sessions", "O") },
  "AC-23": { kind: "e2e",      run: accessCell("kaist", "/portal/sessions", "/alumni/membership") },
  "AI-01": { kind: "api",      run: tutorAuthz },          // 재학생/admin 200, 그 외 403
  "LMS-Q01": { kind: "action", run: askQuestionPersists },
  "LMS-A03": { kind: "action+db", run: aiAnswerStoredWithSource },
  "SEC-12": { kind: "rls",     run: membershipSelfUpdateDenied },
  // 자동화 불가/미대상은 명시적으로 표시 → 리포트에서 "manual"로 집계
  "LMS-V05": { kind: "manual", note: "YouTube seek 실클릭 — 스모크만" },
};
```
- 문서에 있으나 레지스트리에 없는 ID → 리포트에서 **"미자동화(manual)"** 로 집계(누락 방지).
- 레지스트리에 있으나 문서에 없는 ID → **"고아 테스트"** 경고.

### 4.2 상태 컬럼 파싱 규칙
| 문서 기호 | 의미 | 기대 자동 결과 |
|---|---|---|
| ✅ | 구현됨 | pass 기대. fail이면 🔴 회귀 |
| ⚠ | 목업/부분 | fail(xfail) 기대. pass면 🟢 신규 통과 |
| ❓ | 미검증 | 결과가 상태를 확정(🟡) |
| P0 보안·돈 표기 | — | 리포트 상단 강조, 회귀 시 즉시 배포 차단 |

## 5. 기능 요구사항

### 5.1 계정·데이터 프로비저닝 (P0)
- FR-1: 5개 테스트 계정(README 표)을 idempotent 생성/갱신 — 기존 `seed_test_users` 패턴을
  `tests/provision.mjs`로 정식화. 비밀번호 `uscdon00`, has_password=true.
- FR-2: 상태 픽스처 — enrollment.status·membership.status를 setup에서 바꾸고 teardown에서 원복
  (AC-32/33/34, LMS 권한 케이스). 각 테스트가 자기 상태를 소유.
- FR-3: LMS 픽스처 — 지정 세션에 영상 1개+자료 2개 시드, 테스트가 만든 질문/답변을 teardown에서 정리
  (`session_questions`/`session_answers`/`videos`/`materials`).
- FR-4: **격리** — 프로덕션 오염 금지. Supabase 프리뷰 브랜치 또는 전용 test 프로젝트 + 해당
  Vercel preview URL 대상으로 실행.

### 5.2 접근 매트릭스 E2E (P0) — 01·02·08 권한
- FR-5: Playwright. 계정별 1회 로그인 → `storageState` 저장 → 라우트별 최종 URL + 핵심 DOM 마커 단언.
  02번 매트릭스(65셀)와 08번 영상/자료 권한(LMS-V09/V10/M04)을 데이터 테이블로 순회 생성.
- FR-6: 리다이렉트 무한루프 감지(AC-35). 모바일 뷰포트 탭 노출(AC-40/41) 별도 프로젝트.

### 5.3 API 계약 · RLS (P0) — 03·05·07·08 보안
- FR-7: 화면 없이 각 역할 access_token으로 직접 호출:
  - `/api/ai/tutor` POST → 재학생/admin 200, 그 외 403 (AI-01/LMS-AI04).
  - Supabase REST/RPC 토큰별: 타인 invoice/profile/membership, `match_rag_chunks` revoke,
    sessions update 거부, `session_questions`/`session_answers` insert 권한(LMS-Q05/A06/A07),
    videos/materials admin-only 쓰기(LMS-ADM07) (SEC-01~13).
- FR-8: service_role 키가 클라이언트 번들에 없음을 정적 검사(SEC-11).

### 5.4 서버액션 · LMS 플로우 (P0/P1) — 04·08
- FR-9: 서버액션을 로그인 세션으로 호출하고 **DB 상태를 직접 읽어 단언**:
  - 선발: `updateApplicationStatus` → applications.status (ADM-10/11).
  - 커리큘럼: insert/save/reorder → sessions·sort_order·change_logs (ADM-14~18).
  - 영상/자료: setSessionVideo/addMaterial/deleteMaterial → videos·materials (LMS-ADM01~05).
  - Q&A: askQuestion/answerQuestion/answerWithAi → session_questions·session_answers,
    특히 **answerWithAi가 is_ai=true 답변을 저장**하고 출처 문자열을 포함하는지(LMS-A03/A04).
- FR-10: LMS 영상 seek(LMS-V05/06)는 브라우저에서 `VideoPlayer` 핸들 호출 후
  player state를 evaluate로 확인(YouTube: 재생상태/시간, mp4: currentTime). 제한 시 manual 태그.

### 5.5 정적 게이트 린트 (P0)
- FR-11: `app/portal/**/page.tsx`, `app/alumni/**/page.tsx`가 대응 `require*Access` 호출을 포함,
  `app/admin/**`은 admin layout 하위인지 AST/정규식 검사. 누락 시 실패(02번 갭 3).
- FR-12: `app/api/**/route.ts` 보호 대상이 권한 검사 코드를 포함하는지 검사.

### 5.6 RAG 스모크 (P1) — 03·08
- FR-13: 재학생 토큰으로 "18기 등록비" 질문 → 응답에 "220만원" + 출처 문자열 포함(AI-02).
- FR-14: `npm run rag:sync`를 임시 파일 추가/삭제로 돌려 증분 동작 단언(AI-09/10). test 프로젝트 벡터테이블.

### 5.7 케이스 파서 + 리포트 생성기 (P0) — "리포트를 만든다"
- FR-15 **파서**: `tests/report/parse-cases.mjs`가 `docs/class/test-cases/0*.md`의 표를 읽어
  `{ id, file, section, priority, declaredStatus, scenario }[]`를 추출한다.
- FR-16 **실행 수집**: Playwright/vitest 리포터가 각 케이스 ID별 `{ id, result: pass|fail|skip, durationMs, error? }`를
  JSON으로 남긴다(`tests/report/results.json`). 테스트 제목에 케이스 ID를 접두로 달아 매핑
  (예: `test("LMS-A03 AI 조교 답변 저장", ...)`).
- FR-17 **대조·분류**: 생성기가 선언 상태 vs 실제 결과를 4.2 규칙으로 대조해 각 케이스를
  🔴회귀 / 🟢신규통과 / ⚪예상미구현 / 🟡검증됨 / ✅정상통과 / ⚪manual 로 분류.
- FR-18 **출력**:
  - `reports/report-<ISO>.md` — 요약(총계·회귀·신규통과) + 역할×라우트 히트맵 + 케이스 ID 표.
  - `reports/report-<ISO>.json` — 기계 판독용.
  - `reports/latest.md` — CI 코멘트/PR용 최신본.
- FR-19 **게이트**: 🔴회귀(특히 P0 보안·돈)가 1건이라도 있으면 exit 1. 🟢신규통과는 exit 0이되
  "문서 상태 갱신 필요" 목록을 출력.
- FR-20 (옵션) **문서 자동 갱신**: `--apply-status` 플래그 시, 🟢신규통과·🟡검증됨 케이스의 문서
  상태 컬럼을 자동 수정하는 PR 초안 생성(휴먼 리뷰 후 머지).

## 6. 리포트 포맷 (예시 출력)

```markdown
# 테스트 리포트 — 2026-07-20T02:11Z (preview: ai4ceo-portal-xxxx)
대상 커밋: 28fddef · 환경: Supabase branch test-01

## 요약
| 구분 | 수 |
|---|---|
| 전체 케이스(문서) | 174 |
| 자동화 실행 | 132 |
| ✅ 정상 통과 | 118 |
| 🔴 회귀(문서 ✅ ↔ 실패) | 0 |
| 🟢 신규 통과(문서 ⚠ ↔ 통과) | 3 |   ← 문서 갱신 대상
| ⚪ 예상 미구현(xfail) | 11 |
| ⚪ 미자동화(manual) | 42 |

## 🔴 회귀 (배포 차단) — 없음

## 🟢 신규 통과 → 문서 상태 갱신 필요
- BIL-05 관리자 입금확인 → paid : 문서 ⚠ → 실제 통과. 05-billing-tax.md 갱신.

## 케이스별 결과
| ID | 파일 | 우선순위 | 선언 | 실제 | 판정 |
|---|---|---|---|---|---|
| AC-19 | 02 | P0 | ✅ | pass | ✅ |
| AC-23 | 02 | P0 | ✅ | pass | ✅ |
| LMS-A03 | 08 | P0 | ✅ | pass | ✅ |
| LMS-V05 | 08 | P0 | ❓ | — | ⚪ manual |
| BIL-05 | 05 | P0 | ⚠ | pass | 🟢 |
```

## 7. 기술 설계

| 레이어 | 도구 | 근거 |
|---|---|---|
| E2E 브라우저 | Playwright(`@playwright/test`) | storageState 다계정, 리다이렉트 추적, 리포터 |
| API/RLS/서버액션 | Playwright `request` 또는 vitest + supabase-js | 토큰별 직접 호출, DB 단언 |
| 정적 게이트 린트 | Node 스크립트(정규식/ts-morph) | 의존성 최소 |
| 계정/데이터 프로비저닝 | Supabase Admin API(service role) | 기존 seed 재사용 |
| 케이스 파서·리포트 | Node(마크다운 표 파서) | 문서=명세 |
| 격리 | Supabase branch + Vercel preview | 프로덕션 비오염 |
| CI | GitHub Actions(PR trigger) | 배포 전 게이트 + PR 코멘트 |

디렉토리(안):
```
apps/ai4ceo/tests/
  fixtures/accounts.ts          # 5계정 + 상태전이 헬퍼 (FR-1/2)
  fixtures/lms.ts               # 영상/자료/Q&A 시드·정리 (FR-3)
  matrix.access.spec.ts         # 01·02·08 권한 (FR-5/6)
  api.authz.spec.ts             # 03·08 /api/ai/tutor (FR-7)
  rls.security.spec.ts          # 05·07·08 RLS (SEC-*, LMS-*07)
  actions.admin.spec.ts         # 04 서버액션+DB (FR-9)
  lms.session.spec.ts           # 08 Q&A/영상/자료 플로우 (FR-9/10)
  rag.smoke.spec.ts             # 03·08 RAG (FR-13/14)
  static/gate-lint.mjs          # FR-11/12
  report/parse-cases.mjs        # FR-15
  report/generate.mjs           # FR-17~20
  registry.ts                   # 케이스 ID → 구현 (4.1)
  provision.mjs                 # FR-1
playwright.config.ts

docs/class/test-cases/reports/  # 생성된 리포트 산출물
```

npm 스크립트:
```jsonc
"test:provision": "node tests/provision.mjs",
"test:e2e":       "playwright test",
"test:lint-gates":"node tests/static/gate-lint.mjs",
"test:report":    "node tests/report/generate.mjs",     // results.json → reports/*.md
"test:all":       "npm run test:provision && npm run test:lint-gates && npm run test:e2e && npm run test:report"
```

## 8. 마일스톤

- **M1 (0.5일)**: provision + Playwright 셋업 + 접근 매트릭스 E2E(FR-5) + 케이스 파서(FR-15). 최고 ROI.
- **M2 (0.5일)**: API/RLS(FR-7/8) + 정적 게이트 린트(FR-11/12) + 리포트 생성기 v1(FR-16~19).
- **M3 (0.5일)**: 서버액션·LMS 플로우(FR-9/10) + RAG 스모크(FR-13/14).
- **M4 (0.5일)**: GitHub Actions 연결 + Supabase 브랜치 격리 + PR 코멘트 + `--apply-status`(FR-20).

## 9. 리스크·미결정

- **격리 환경**: 현재 프로덕션 Supabase 하나. 브랜치/전용 프로젝트 결정 필요(권장: Supabase branch).
- **매직링크 E2E**(AUTH-05): 메일 수신 필요 → Admin API `generateLink`로 세션 직접 발급해 우회, 또는 manual.
- **LLM 비결정성**(RAG·AI 답변): 정확 문자열 대신 "220만원 포함" 같은 느슨한 단언 + 재시도. effort low로 비용 억제.
- **영상 seek**(LMS-V05/06): YouTube postMessage는 iframe cross-origin이라 state 확인이 제한적 → 스모크/manual.
- **Fable 5 비용**: 스모크는 최소 질문 1건 + effort low.

## 10. 지표

- 자동화 실행 케이스 커버리지(문서 대비 %)와 🔴회귀 0건 유지.
- ⚪예상미구현(xfail) 감소 곡선 = 목업→실구현 진척(릴리스 리포트에 노출).
- P0 보안·돈 케이스 100% 자동 검증.
