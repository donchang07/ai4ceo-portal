# CLAUDE.md

## 프로젝트 규칙 (스택·폴더·코딩)

- 스택: Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind 4 · Supabase(`@supabase/ssr`) · **npm** (pnpm/yarn 금지)
- 앱 본체는 **`apps/ai4ceo`** 하나뿐 — 루트에 package.json이 없으므로 모든 명령은 `apps/ai4ceo`에서 실행
- 폴더: `app/`(라우트) · `components/` · `lib/`(core·db·ai·billing·notify) · `supabase/migrations/`
- 서버 컴포넌트 우선, `'use client'`는 인터랙션 필요 시만
- DB 접근은 서버 컴포넌트/서버 액션에서 `lib/db/supabase-server.ts` 팩토리로, 브라우저는 `lib/db/supabase-client.ts`(anon key 전용)로만
- **`middleware.ts`는 세션 쿠키 갱신 전용이며 접근 차단을 하지 않는다.** 새 페이지에는 반드시 `lib/db/auth.ts`의 `requireLmsAccess()` 등 가드를 직접 호출할 것
- 스키마 변경은 `apps/ai4ceo/supabase/migrations/`에 타임스탬프 접두사 새 파일로만 — 기존 마이그레이션 수정 금지. 새 테이블은 RLS 정책 없이 배포하지 않는다

## 도메인 컨텍스트

- **AI4CEO Portal** = CEO 대상 AI 교육 과정(기수제)의 수강생 포털(LMS) + 동문 멤버십 + 관리자 콘솔
- 용어: `profiles`(사용자·role) · `enrollments`(기수 수강, 상태 기반 접근 게이팅) · `sessions`(강의 회차) · `applications`(지원서) · `invoices`/`tax_invoices`(결제·세금계산서) · `ai_question_logs`(AI 조교 질의 로그)
- 데이터 접근은 **RLS 기준 격리**: 본인 데이터 self-access + `is_admin()`/`is_enrolled()` (기준 스키마·정책 57개는 `20260719090000_schema.sql` 한 파일)
- 관리자 = `profiles.role === 'admin'` + `ADMIN_EMAIL` 부트스트랩 폴백(`lib/db/auth.ts`) — 폴백 제거 시 최초 관리자 온보딩이 깨지는지 확인
- 로그인 = 최초 매직링크 → 이후 이메일+비밀번호(`profiles.has_password` 기준). 로그인 수정 시 두 경로 모두 확인

## 검증 명령

- `npm run build` · `npx tsc --noEmit` 모두 통과가 기준
- `npm run lint`는 현재 eslint 미구성으로 **실질 미동작** — lint 통과를 검증 근거로 쓰지 말 것 (구성 전까지 build+typecheck+해당 화면 수동 확인으로 대체)

## 금지 사항

- `any` 타입 금지 (현재 0건 유지)
- `console.log` 잔존 금지
- service role 키 클라이언트 노출 금지 — service_role 클라이언트는 현재 코드베이스에 의도적으로 없음, 새로 만들지 말 것 (`SUPABASE_SERVICE_ROLE_KEY`는 미제공 TODO 상태 — 필요한 기능은 구현 전 사용자와 상의)
- 하드코딩된 자격증명 금지 — 키는 전부 `process.env.*`, 실제 값은 루트 `.env`/`apps/ai4ceo/.env.local`(git 미추적), 키 목록은 `.env.local.example`
- 입력 검증 라이브러리 신규 도입 금지 — zod가 이미 설치돼 있으니 그것을 사용

## 출력 형식

- 변경 파일 경로와 변경 이유를 명시
- 검증 명령(build·typecheck) 실행 결과를 포함
- 패키지 설치 전 반드시 확인 요청
- 참고 문서: PRD `docs/prd/ai4ceo-portal-PRD-v3_2.docx` (md 변환본 `docs/prd/prd-v3.2.md`) · 디자인 토큰 `docs/DESIGN.md`, `docs/brandvoice.md`
