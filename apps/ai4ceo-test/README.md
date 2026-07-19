# ai4ceo-test — 비즈니스 테스트 자동화 & QA 대시보드

`docs/class/test-cases/PRD-test-automation.md` (v0.3) 구현. 두 표면:

- **(A) 하네스** `tests/` — Playwright + node 스크립트. 01~08 케이스를 실제 프로덕션 환경에 대해 실행하고 리포트 JSON/MD 생성.
- **(B) QA 대시보드** `app/` — 리포트 JSON을 시각화하는 읽기 전용 화면(11장 P0).

독립 Next.js 15 앱(자체 package.json). 메인 앱(`apps/ai4ceo`)과 분리되어 별도 Vercel 프로젝트로 배포된다.

## 실행

```bash
cd apps/ai4ceo-test
npm install
npx playwright install chromium   # E2E용(실패 시 비브라우저 테스트만 실행 가능)

npm run test:provision     # FR-1: 5개 테스트 계정 idempotent 프로비저닝
npm run test:lint-gates    # FR-11/12/8: 정적 게이트 린트 (메인앱 코드 검사)
npm run test:api           # 비브라우저: API 인가/RLS/RAG/서버액션 DB 단언 (chromium 불필요)
npm run test:e2e           # 전체 Playwright(E2E 매트릭스 포함, chromium 필요)
npm run test:report        # FR-16~19: results.json → latest.json + reports/*.md
npm run test:all           # provision → lint-gates → e2e → report
```

## 리포트 계약

`tests/report/generate.mjs` 가 쓰는 `tests/report/latest.json` 이 대시보드 입력이다.
`docs/class/test-cases/reports/` 로도 복사된다. 🔴 회귀가 1건이라도 있으면 `generate.mjs` 는 exit 1(배포 차단).

## 매핑

- 문서(01~08.md)의 표 = 파싱 가능한 명세 (`tests/report/parse-cases.mjs`, FR-15).
- 케이스 ID ↔ 자동 테스트 = `tests/registry.mjs` (4.1). 테스트 title 접두에 케이스 ID.
- 대조·분류 규칙 = PRD 4.2 (✅↔fail=🔴회귀, ⚠↔pass=🟢신규통과, ❓→🟡검증됨 …).

## 환경변수

`.env.local.example` 참고. 프로덕션 Supabase(ref: olofwxsavfthsmmwjwzk) 재사용, 테스트 계정 5개(비밀번호 `uscdon00`).
쓰기 테스트는 teardown 에서 정리한다. 대시보드는 `middleware.ts` basic-auth(기본 admin/uscdon00)로 보호.

## 대시보드 빌드

```bash
npm run build   # app/ 만 컴파일. tests/ (Playwright)는 빌드에 포함되지 않음.
```
