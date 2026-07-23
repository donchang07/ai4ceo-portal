# 01. Public site and application

모든 케이스는 `00-fixtures.md`를 참조한다. 표의 assertion은 모두 충족해야 통과한다.

| ID | PRD | Pri | Layer | Preconditions | Test data | Steps | Assertions | Forbidden | Cleanup | Gate |
|---|---|---:|---|---|---|---|---|---|---|---|
| PUB-001 | A-1 | P0 | e2e | guest | — | `/` 접속 | 최종 URL `/`; `지원하기` CTA visible; CTA href `/apply`; 콘솔 page error 0건 | 인증 페이지 이동, 빈 본문 | 없음 | must_pass |
| PUB-002 | A-2 | P0 | e2e | guest | PRD 일정 `2026-09-07`, 10회, 18:00~21:00 | `/program` 접속 | 18기 개강일, 총 10회, Zoom, 4대 트랙 문구가 PRD 값과 일치 | 과거 값 `9/9(수)` 노출 | 없음 | must_pass |
| PUB-003 | A-3 | P0 | e2e | guest | FAQ 키워드 `지원 자격`, `결제`, `환불` | `/program` 하단 FAQ 열기 | 3개 카테고리/답변 visible; 키보드 Enter로 열림 | `/faq` 필수 의존 | 없음 | must_pass |
| PUB-004 | A-5 | P0 | static/e2e | production build | — | `/`, `/program`, `/apply`, `/trends` 접속 후 head 검사 | 각 페이지 title과 description non-empty; canonical 동일 origin; OG title/image 존재; sitemap에서 공개 경로 확인 | `noindex`, 깨진 OG URL | 없음 | known_gap |
| PUB-005 | US-01 | P1 | e2e | guest | 자가진단 5개 응답 fixture | `/program`에서 자가진단 시작→5문항 응답 | 결과 영역과 적합도 문구; 지원 CTA `/apply` | 5문항 미만, 결과 없는 종료 | 없음 | automated |
| PUB-006 | US-02 | P1 | e2e | guest | 비교 축 `직접 만드는 실습`, `CEO의 의사결정 관점`, `수료 후 지속` | `/program` 비교 섹션 확인 | 세 축과 비교 대상 3종 모두 visible | 단순 마케팅 문구만 표시 | 없음 | automated |
| APP-001 | B-2 | P0 | e2e | guest | `application.*` | `/apply`에서 7단계를 순서대로 입력하고 이전/다음 사용 | 진행표시 `1 / 7`→`7 / 7`; 이전 후 입력 유지; 추천코드는 선택; 제출 버튼 visible | 필수값 없이 다음 활성화 | 생성 전이므로 없음 | must_pass |
| APP-002 | B-2 | P0 | e2e | guest | 각 필수 필드 `"   "` | 이름·회사·직함·전화·이메일·동기 단계별 공백 입력 | 각 단계에서 다음/제출 disabled | 공백값 DB 전송 | 없음 | must_pass |
| APP-003 | B-2 | P0 | e2e/api | guest | email=`not-an-email`, phone=`123` | 해당 단계에서 값 입력 | 정확한 validation 문구; insert 요청 0건 | 완료 화면 표시 | 없음 | known_gap |
| APP-004 | B-2 | P0 | e2e/db | staging, anon insert 정책 | `application.*` | 전체 폼 제출 | `applications` 행 정확히 1개; cohort_id=`cohort18.id`; 7개 입력값 일치; status=`received`; created_at 존재 | DB 실패를 숨기고 성공 화면 표시 | 생성 application 삭제 | must_pass |
| APP-005 | B-3 | P0 | e2e | APP-004와 동일 | — | 제출 완료 화면 확인 | 제목 `지원이 접수되었습니다`; 접수번호 `/^AP-18-\d{4}$/`; 안내 문구 visible | 접수번호 공백 | APP-004 cleanup | must_pass |
| APP-006 | B-3,G-1 | P0 | contract/db | staging notification provider | APP-004 row | 지원서 제출 | email과 알림톡 outbox 각각 1건; recipient가 입력값과 일치; template=`T-01`; 접수번호 포함 | 실제 운영 수신자 발송, 중복 발송 | outbox와 application 삭제 | known_gap |
| APP-007 | B-8,J-2 | P0 | e2e/db | referral seed `R17-KSH` | `application.referralCode` | 추천코드 포함 제출 | applications.referral_code=`R17-KSH`; 추천 귀속 FK/조회 결과가 seed 추천인과 일치 | 공백 또는 임의 추천인 귀속 | 생성 application 삭제 | must_pass |
| APP-008 | B-8 | P0 | e2e/db | guest | referral=`INVALID-${RUN_ID}` | 지원서 제출 | 정책에 따라 명시적 오류로 제출 차단 또는 referral_code=null; 선택한 정책과 DB가 일치 | 유효한 추천인으로 오귀속 | 생성 application 삭제 | known_gap |
| APP-009 | US-03,B-4 | P0 | e2e/api | received application seed | application email/phone | `/apply/status`에서 이메일·전화 입력→`상태 조회` | `접수 완료` 배지; 단계 `접수` active, `심사/발표` inactive; cohort명/접수일 표시 | 다른 지원자의 상태 노출 | seed 삭제 | must_pass |
| APP-010 | US-03 | P0 | e2e/api | reviewing application seed | application email/phone | 상태 조회 | `심사 중`; 접수와 심사 active, 발표 inactive | received로 표시 | seed 삭제 | must_pass |
| APP-011 | US-03 | P0 | e2e/api | accepted application seed | application email/phone | 상태 조회 | `합격`; 세 단계 모두 active | 다른 상태 표시 | seed 삭제 | must_pass |
| APP-012 | US-03 | P0 | e2e | guest | unknown.email + application.phone | 상태 조회 | `일치하는 지원 내역이 없습니다`; application 상세 0건 | 이메일 존재 여부를 구분하는 문구 | 없음 | must_pass |
| APP-013 | US-03 | P0 | e2e | guest | invalid email, 9자리 phone | 상태 조회 | `올바른 이메일을 입력해 주세요.` 또는 `전화번호를 숫자 10자리 이상으로 입력해 주세요.`; RPC 호출 0건 | 서버 오류 문구 | 없음 | must_pass |
| APP-014 | B-4,SEC | P0 | api | application A/B seed | A email + B phone | `lookup_application_status` 호출 | 빈 배열; 반환 필드에 name/email/phone/motivation 없음 | 부분 일치 결과, PII 반환 | seed 삭제 | must_pass |

## Known specification conflict

PRD B-2에는 `AI 활용 현황` 필드가 있으나 현재 `/apply` 구현에는 없다. 해당 필드를 제품에 추가하기 전까지 APP-001은 현재 7단계를 검증하고, 추적표에는 B-2 부분 커버로 표시한다.

