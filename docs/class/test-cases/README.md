# AI4CEO Portal — 비즈니스 테스트 케이스

PRD v2.6 기반 MVP(15개 화면 + RAG AI 조교)의 비즈니스 시나리오 테스트 모음.
각 케이스는 **현재 코드의 실제 구현 상태**를 기준으로 작성되었으며, 목업/미구현 부분은
`⚠ 알려진 갭`으로 명시한다. 즉 이 문서는 테스트 계획인 동시에 **구현 갭 등록부**다.

## 파일 구성

| 파일 | 영역 | 케이스 수 |
|---|---|---|
| [01-auth-login.md](01-auth-login.md) | 인증 · 매직링크 · 비밀번호 | 14 |
| [02-access-control.md](02-access-control.md) | 역할×상태 화면 접근 매트릭스 (핵심) | 42 |
| [03-ai-tutor-rag.md](03-ai-tutor-rag.md) | AI 조교 · RAG · 권한 | 16 |
| [04-admin-console.md](04-admin-console.md) | 관리자 콘솔 완비성 | 20 |
| [05-billing-tax.md](05-billing-tax.md) | 결제 · 세금계산서 · 어댑터 준비도 | 15 |
| [06-apply-public.md](06-apply-public.md) | 공개 사이트 · 지원서 | 12 |
| [07-data-rls-security.md](07-data-rls-security.md) | RLS · API 직접 공격 시나리오 | 13 |
| [PRD-test-automation.md](PRD-test-automation.md) | 테스트 자동화 도구 PRD | — |

## 테스트 계정 (모두 비밀번호 `uscdon00`, 프로덕션 Supabase에 실존)

| 이메일 | 역할 | enrollment.status | 멤버십 | 용도 |
|---|---|---|---|---|
| donchang0725@gmail.com | admin | (없음) | — | 슈퍼 관리자 |
| donchang@hanmail.net | student | in_training | — | 재학 수강생 |
| donchang0725@naver.com | alumni | completed | active | 졸업생 + 멤버십 |
| donchang@kaist.ac.kr | alumni | completed | (없음) | 졸업생 미가입 |
| donchang0725@kakao.com | applicant | (없음) | — | 미등록 관심자 |

## 상태 기반 접근 규칙 (기준 명세 — PRD 1.7)

| 구역 | 접근 조건 | 코드 게이트 |
|---|---|---|
| 공개 페이지 (`/`, `/program`, `/apply`, `/trends`, `/login`) | 누구나 | 없음 |
| `/portal/billing` | enrollment 레코드 보유자 + admin | `requireBillingAccess` |
| LMS 인터랙티브 (`/portal/cohort·chat·ai·assignments`) | in_training(enrolled 포함) + assistant + admin | `requireLmsAccess` |
| 아카이브 (`/portal/sessions`, `/portal/sessions/[id]`, `/portal/files`) | in_training + **졸업생 중 멤버십 active** + admin | `requireArchiveAccess` |
| 동문 (`/alumni`, `/alumni/membership`) | completed/alumni + admin | `requireAlumniAccess` |
| 관리자 (`/admin/*`) | role=admin | `app/admin/layout.tsx` |
| `/api/ai/tutor` | in_training + admin (403) | 라우트 내 검사 |

## 표기 규칙

- **P0** 출시 차단 (돈·보안·데이터 직결) / **P1** 출시 후 1주 내 / **P2** 백로그
- 상태: ✅ 통과 예상(구현됨) · ⚠ 알려진 갭(목업/부분구현 — 테스트하면 실패하는 것이 정상) · ❓ 미검증
- 케이스 ID: `영역-번호` (예: AC-07)

## 수동 실행 방법

1. 시크릿 창에서 https://ai4ceo-portal.vercel.app 접속
2. 위 테스트 계정으로 로그인 후 각 케이스의 절차 수행
3. 기대결과와 다르면 케이스 ID와 함께 기록

자동화 방안은 [PRD-test-automation.md](PRD-test-automation.md) 참조.
