# 00. Test fixtures and data contract

## Environment variables

| Key | Example | Rule |
|---|---|---|
| `TEST_BASE_URL` | `https://ai4ceo-portal-git-qa.example.vercel.app` | mutation 테스트에서 production URL이면 즉시 실패 |
| `NEXT_PUBLIC_SUPABASE_URL` | staging project URL | `TEST_BASE_URL`과 같은 환경이어야 함 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon key | 로그에 원문 출력 금지 |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service key | Node fixture에서만 사용, 브라우저 주입 금지 |
| `TEST_ACCOUNT_PASSWORD` | CI secret | 문서·trace·screenshot에 노출 금지 |
| `TEST_MAGIC_EMAIL` | controlled inbox | 매직링크 테스트 전용 |
| `RUN_ID` | `20260722153045` | 누락 시 테스트 시작 시 생성 |

## Account fixtures

| Key | Role/state | Required initial state | Intended use |
|---|---|---|---|
| `admin` | admin | profile.role=`admin` | 관리자 UI와 admin RLS |
| `student` | student | enrollment.status=`in_training` | LMS·AI·결제 |
| `assistant` | assistant | `assistant_links`로 student와 연결 | 위임 기능과 연결 범위 |
| `alumni_member` | alumni | enrollment=`completed`, membership=`active`, `end_date=2027-12-31` | 아카이브 허용 |
| `alumni_expired` | alumni | enrollment=`completed`, membership=`expired` | 아카이브 차단 |
| `applicant` | applicant | enrollment 없음 | 공개·지원자 리다이렉트 |
| `guest` | unauthenticated | storage state 없음 | 공개·로그인 게이트 |

계정 이메일은 CI secret 또는 `tests/fixtures/accounts.ts`에서 읽는다. 문서에는 실제 비밀번호를 기록하지 않는다.

## Deterministic data

| Key | Value |
|---|---|
| `application.name` | `QA지원자-${RUN_ID}` |
| `application.company` | `Codex QA ${RUN_ID}` |
| `application.title` | `대표이사` |
| `application.phone` | `010-9${RUN_ID.slice(-7)}` |
| `application.email` | `qa.application+${RUN_ID}@example.com` |
| `application.referralCode` | `R17-KSH` |
| `application.motivation` | `QA-${RUN_ID}: 제조 공정 보고 자동화` |
| `unknown.email` | `qa.unknown+${RUN_ID}@example.com` |
| `valid.password` | `Qa-${RUN_ID}!Aa1` |
| `short.password` | `Qa1!abc` |
| `wrong.password` | `Wrong-${RUN_ID}!` |
| `task.title` | `QA-${RUN_ID} 3주차 과제 자료 정리` |
| `task.note` | `QA-${RUN_ID} 회의 전 초안을 작성한다` |
| `build.title` | `QA-${RUN_ID} 고객문의 분류기` |
| `build.description` | `문의 분류 시간을 줄이는 내부 도구` |
| `build.repoUrl` | `https://example.com/qa/${RUN_ID}` |
| `build.effectMemo` | `QA-${RUN_ID}: 주 5시간 절감, 월 20만원 비용 절감` |
| `roadmap.diagnosis` | `QA-${RUN_ID}: 고객문의 분류가 수작업이다` |
| `roadmap.priorities` | `1. 분류 자동화\n2. 답변 초안` |
| `roadmap.plan90d` | `30일 PoC, 60일 파일럿, 90일 적용` |
| `roadmap.expansion` | `영업 문의와 VOC 분석으로 확장` |
| `question.body` | `QA-${RUN_ID}: 18기 등록비와 결제 절차를 알려주세요.` |
| `answer.body` | `QA-${RUN_ID}: 강사 테스트 답변` |
| `material.title` | `QA-${RUN_ID} 강의자료` |
| `material.url` | `https://example.com/qa-material-${RUN_ID}.pdf` |
| `video.url` | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |

## Stable seed IDs

| Key | Value | Verification before use |
|---|---|---|
| `cohort18.id` | `00000000-0000-0000-0000-0000000000c1` | cohorts 행의 이름이 18기인지 확인 |
| `demoSession.id` | `ed04829b-148e-4ae8-8462-cf80b41666db` | session이 cohort18에 속하는지 확인 |

seed 검증이 실패하면 임의의 운영 행을 대신 사용하지 말고 테스트를 setup failure로 종료한다.

## Cleanup contract

1. 생성한 행의 primary key를 즉시 배열에 기록한다.
2. 참조 자식 행부터 역순으로 삭제한다.
3. 기존 행을 수정한 경우 원본 snapshot을 복원한다.
4. `afterEach` 이후 `QA-${RUN_ID}`가 남아 있지 않은지 테이블별로 조회한다.
5. cleanup 실패는 테스트 본문 성공 여부와 무관하게 전체 실행 실패다.

정리 대상: `applications`, `delegated_tasks`, `builds`, `roadmaps`, `session_catchups`, `session_questions`, `session_answers`, `materials`, `videos`, `ai_question_logs`, 테스트용 `notifications`와 `tax_invoices`.

