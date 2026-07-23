# AI4CEO Portal PRD v3.0 acceptance test specification

이 폴더는 `ai4ceo-portal-PRD-v3_0.docx`를 기준으로 작성한 Playwright 실행 명세다. 구현 현황을 설명하는 체크리스트가 아니라, 관찰 가능한 결과로 합격과 실패를 판정하는 acceptance test가 기준이다.

## 실행 원칙

1. `TEST_BASE_URL`은 Vercel preview 또는 staging이어야 한다. `https://ai4ceo-portal.vercel.app`에서 생성·수정·삭제·상태 전이 테스트를 실행하지 않는다.
2. 모든 생성 데이터에는 `QA-${RUN_ID}`를 포함한다. `RUN_ID`는 UTC `YYYYMMDDHHmmss` 형식이다.
3. 테스트는 자신이 만든 데이터만 삭제한다. 기존 운영 데이터의 ID를 하드코딩해 수정하지 않는다.
4. DB mutation은 `beforeEach`에서 원본을 읽고 `afterEach`의 `finally`에서 원복하며, 원복 결과까지 assertion한다.
5. UI 성공만으로 통과시키지 않는다. 저장 기능은 UI + 네트워크 + DB를 함께 검증한다.
6. `known_gap`은 테스트를 생략한다는 뜻이 아니다. 실행해 실패를 확인하되 릴리스 게이트에서 별도 집계한다.
7. 외부 서비스 이메일·알림톡·Toss·Popbill은 staging provider 또는 mock inbox에서 계약을 검증한다.

## 케이스 필드

| 필드 | 의미 |
|---|---|
| ID | 영구적인 테스트 식별자. Playwright 제목의 접두사로 사용한다. |
| PRD | 원본 PRD 요구사항 또는 유저 스토리 ID |
| Priority | P0/P1/P2 |
| Layer | `e2e`, `api`, `db`, `contract`, `static`, `manual` |
| Preconditions | 계정, seed, 기능 플래그, 초기 상태 |
| Test data | 입력값과 대상 ID. `00-fixtures.md`의 키를 참조한다. |
| Steps | 사용자가 수행하는 순서 또는 API 요청 |
| Assertions | URL, UI, HTTP, DB의 정확한 합격 조건 |
| Forbidden | 절대 발생하면 안 되는 결과 |
| Cleanup | 생성 데이터 삭제 또는 변경값 원복 |
| Gate | `must_pass`, `known_gap`, `manual_only` |

## 파일 구성

| 파일 | 범위 |
|---|---|
| `00-fixtures.md` | 환경, 계정, 고정 입력값, seed/cleanup 계약 |
| `01-public-application.md` | 공개 사이트, 과정 안내, 지원서, 지원 상태 |
| `02-auth-access.md` | 로그인, 비밀번호, 역할·상태 접근 제어 |
| `03-enrollment-billing.md` | 등록, 위임, 인보이스, 입금, 세금계산서, 멤버십 |
| `04-learning-lms.md` | Cohort Home, 세션, 자료, 과제, Q&A, 따라잡기 |
| `05-ai-rag.md` | AI 튜터, RAG, 출처, 에스컬레이션 |
| `06-v3-workflows.md` | 위임 할 일, 결과물, AX 로드맵, 동문 아카이브 |
| `07-admin.md` | 지원자·커리큘럼·콘텐츠·AI·결제 관리자 기능 |
| `08-security-nfr.md` | RLS, 직접 공격, 성능, 접근성, 반응형, SEO/PWA |
| `09-traceability.md` | PRD v3.0 요구사항 추적표와 미커버 갭 |

## Playwright 매핑 규칙

```ts
test("APP-005 지원서 저장", async ({ page }) => { /* ... */ });
```

- 테스트 제목은 반드시 `ID + 공백 + 시나리오`로 시작한다.
- `must_pass` 실패는 exit code 1이다.
- `known_gap`은 `test.fail(true, "PRD gap")`로 실행하며 예상과 다르게 통과하면 새 구현으로 보고 문서를 갱신한다.
- 실패 시 screenshot, trace, 최종 URL, 관련 API response, 생성 데이터의 primary key를 결과에 남긴다.

## 완료 기준

- P0 `must_pass` 100% 통과
- P0 보안/RLS 케이스 skip 0건
- cleanup 실패 0건
- PRD 추적표의 P0 `uncovered` 0건
- production mutation 0건
