# 02. 역할×상태 화면 접근 매트릭스 (AC) — 최우선

**이것이 돈이다**: 결제한 사람, 재학생, 졸업생, 멤버십 가입자가 보는 화면이 정확히 달라야 한다.
5개 테스트 계정 × 주요 라우트 전수 조합. 2026-07-19 프로덕션에서 5계정 전부 수동 검증 완료.

범례 — O: 정상 접근 / R(경로): 해당 경로로 리다이렉트되어야 함

## 전수 매트릭스 (기대결과)

| 라우트 | admin<br>(gmail) | 재학생<br>(hanmail) | 졸업+멤버십<br>(naver) | 졸업 미가입<br>(kaist) | 관심자<br>(kakao) | 비로그인 |
|---|---|---|---|---|---|---|
| `/` `/program` `/trends` `/apply` | O | O | O | O | O | O |
| `/portal/cohort` | O | O | R(/portal/billing) | R(/portal/billing) | R(/) | R(/login) |
| `/portal/chat` | O | O | R(/portal/billing) | R(/portal/billing) | R(/) | R(/login) |
| `/portal/ai` | O | O | R(/portal/billing) | R(/portal/billing) | R(/) | R(/login) |
| `/portal/assignments` | O | O | R(/portal/billing) | R(/portal/billing) | R(/) | R(/login) |
| `/portal/sessions` | O | O | **O** | **R(/alumni/membership)** | R(/) | R(/login) |
| `/portal/sessions/[id]` | O | O | O | R(/alumni/membership) | R(/) | R(/login) |
| `/portal/files` | O | O | O | R(/alumni/membership) | R(/) | R(/login) |
| `/portal/billing` | O | O | O | O | R(/apply) | R(/login) |
| `/alumni` | O | R(/portal/billing) | O | O | R(/) | R(/login) |
| `/alumni/membership` | O | R(/portal/billing) | O | O | R(/) | R(/login) |
| `/admin` 및 `/admin/*` | O | R(/portal/cohort) | R(/portal/cohort) | R(/portal/cohort) | R(/portal/cohort)* | R(/login) |
| `/api/ai/tutor` (POST) | 200 | 200 | **403** | 403 | 403 | 403 |

\* 비로그인은 `/login?next=/admin`.

## 개별 케이스 (매트릭스에서 파생 — 회귀 시 개별 추적용)

| ID | 계정 | 행동 | 기대결과 | 우선순위 |
|---|---|---|---|---|
| AC-01~13 | admin | 위 13개 라우트 전부 접근 | 전부 O (게이트 전면 우회) | P0 |
| AC-14 | 재학생 | `/portal/cohort` 접근 | Cohort Home 렌더 (My Build·This Week 카드) | P0 |
| AC-15 | 재학생 | `/portal/chat`에 메시지 입력 | 화면상 전송됨 (⚠ DB 미저장 — 목업) | P0 |
| AC-16 | 재학생 | `/alumni` 접근 | `/portal/billing`으로 튕김 — 재학생은 동문 화면 불가 | P0 |
| AC-17 | 재학생 | `/admin` 접근 | `/portal/cohort`로 튕김 | **P0 보안** |
| AC-18 | 재학생 | 사이드바에 "관리자" 메뉴 노출 여부 | 노출 안 됨 (admin만 노출) | P1 |
| AC-19 | 졸업+멤버십 | `/portal/sessions` 접근 | 세션 목록 O — 멤버십 혜택(전 기수 녹화본 read-only) | **P0 돈** |
| AC-20 | 졸업+멤버십 | `/portal/chat` 접근 | R(/portal/billing) — 대화방은 재학생 전용 | P0 |
| AC-21 | 졸업+멤버십 | `/portal/ai` 접근 | R — AI 조교는 재학생 전용 | P0 |
| AC-22 | 졸업+멤버십 | `/alumni/membership` 표시 | "이용 중" + 실제 만료 D-day 표시 (하드코딩 아님) | P0 |
| AC-23 | 졸업 미가입 | `/portal/sessions` 접근 | **R(/alumni/membership)** — 가입 유도 화면 | **P0 돈** |
| AC-24 | 졸업 미가입 | `/alumni/membership` 표시 | "미가입" 배지 + "멤버십 가입하기" CTA | P0 |
| AC-25 | 졸업 미가입 | `/portal/files` 접근 | R(/alumni/membership) | P0 |
| AC-26 | 졸업 미가입 | `/alumni` 접근 | O — AS Q&A 등 기본 동문 서비스는 열림 | P1 |
| AC-27 | 관심자 | `/portal/cohort` 접근 | R(/) — 랜딩으로 | P0 |
| AC-28 | 관심자 | `/portal/billing` 접근 | R(/apply) — 지원 유도 | P0 |
| AC-29 | 관심자 | `/trends` 열람 | public 글만 노출, 잠금 카드에 "지원하고 열람하기" | P1 |
| AC-30 | 비로그인 | `/admin` 직접 URL 입력 | `/login?next=/admin` | **P0 보안** |
| AC-31 | 비로그인 | `/portal/sessions/s1` 직접 URL | `/login` | P0 |
| AC-32 | (DB조작) 멤버십 status를 expired로 변경 | naver 계정으로 `/portal/sessions` 재접근 | R(/alumni/membership) — **만료 시 접근 자동 회수** | **P0 돈** |
| AC-33 | (DB조작) 재학생 status를 dropped로 변경 | hanmail 계정으로 `/portal/cohort` 재접근 | R(/portal/billing) — 중도이탈 시 LMS 회수 | P0 |
| AC-34 | (DB조작) 재학생 status를 completed로 변경 | `/alumni` 접근 O, `/portal/chat` R | 수료 전환 시 화면 자동 전환 | P0 |
| AC-35 | 상태 없는 신규 로그인(관심자) | 로그인 직후 자동 이동 목적지 | `/portal/cohort` 시도 → R(/) — 무한 리다이렉트 없이 종료 | P1 |
| AC-36 | 게이트 우회: RSC 페이로드 | `/portal/cohort?_rsc=...` 직접 fetch | 게이트 서버 컴포넌트에서 실행되므로 데이터 미노출 | P1 |
| AC-37 | assistant 역할 (향후) | assistant 계정 생성 후 LMS 접근 | canAccessLms상 O — CEO 연결(assistant_links) 검증은 미구현 | P2 ⚠ |
| AC-38 | 세션 만료 후 행동 | 쿠키 삭제 후 `/portal/chat` 새로고침 | `/login` | P1 |
| AC-39 | 로그인 상태에서 `/login` 접근 | 재학생이 `/login` 방문 | ⚠ 현재 로그인 화면이 그대로 뜸 — 로그인 상태면 포탈로 보내는 게 자연스러움 (갭, P2) | P2 |
| AC-40 | 모바일 하단 탭 노출 | 재학생 모바일 뷰(390px) | 홈·세션·대화방·AI 4탭 노출 | P1 |
| AC-41 | 졸업생 모바일 탭 | 졸업생 모바일 뷰 | ⚠ 탭 자체는 렌더되나 대화방·AI 탭 클릭 시 billing으로 튕김 — UX상 탭을 숨기는 게 맞음 (갭, P2) | P2 |
| AC-42 | 관리자 nav 링크 | admin으로 `/portal/cohort` 접근 | 사이드바 맨 아래 "관리자" 메뉴 노출 | P1 |

## ⚠ 알려진 갭 요약

1. **AC-37**: assistant는 `assistant_links` 연결 검증 없이 LMS 전체 접근 가능한 코드 경로 (역할 부여 자체를 안 하면 무해).
2. **AC-39/41**: 로그인 상태 UX 다듬기 (기능 아닌 UX 갭).
3. 미들웨어는 세션 갱신만 하고 라우팅 차단은 페이지별 게이트에 의존 — 새 페이지 추가 시 게이트 호출을 빠뜨리면 뚫린다. **새 /portal, /alumni 페이지에는 반드시 requireXxx를 호출할 것** (자동화 도구가 이걸 회귀 검사해야 함).
