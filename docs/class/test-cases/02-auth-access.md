# 02. Authentication and access control

| ID | PRD | Pri | Layer | Preconditions | Test data | Steps | Assertions | Forbidden | Cleanup | Gate |
|---|---|---:|---|---|---|---|---|---|---|---|
| AUTH-001 | C-1 | P0 | e2e | `student` | account email + secret password | `/login`에서 비밀번호 로그인 | `/portal/cohort`; auth cookie 존재; `My Build` visible | `/login` 잔류, 비밀번호 로그 | context 폐기 | must_pass |
| AUTH-002 | C-1 | P0 | e2e | `student` | wrong.password | 올바른 이메일+오류 비밀번호 제출 | 이동 없음; 일반화된 인증 오류 visible; auth cookie 없음 | 계정 존재 여부 노출 | 없음 | must_pass |
| AUTH-003 | C-1 | P1 | e2e | guest | unknown.email + wrong.password | 로그인 제출 | AUTH-002와 동일 문구/상태 | `가입되지 않은 이메일` 같은 enumeration | 없음 | must_pass |
| AUTH-004 | C-1 | P0 | contract/e2e | TEST_MAGIC_EMAIL mailbox | controlled email | 매직링크 요청 | 성공 안내; inbox에 링크 1개; 링크 origin/redirect allowlist 일치 | 타 주소 발송, 링크 로그 출력 | inbox 정리 | must_pass |
| AUTH-005 | C-1 | P0 | e2e/db | 신규 auth user, has_password=false | magic link | 링크 클릭 | callback 후 `/set-password`; profiles 행 1개; 기존 role 변경 없음 | `/portal/*` 직접 진입 | 신규 user/profile 삭제 | must_pass |
| AUTH-006 | C-1 | P0 | e2e/db | AUTH-005 | valid.password 2회 | 비밀번호 설정 제출 | has_password=true; auth password 갱신; 지정 next 경로 이동 | 평문 password DB 저장 | 신규 user/profile 삭제 | must_pass |
| AUTH-007 | C-1 | P1 | e2e | `/set-password` 세션 | short.password | 7자 입력·확인 | `8자 이상` 오류; update 요청 0건 | 서버 호출 | 없음 | must_pass |
| AUTH-008 | C-1 | P1 | e2e | `/set-password` 세션 | valid.password / wrong.password | 서로 다른 확인값 제출 | `일치하지 않습니다`; update 요청 0건 | has_password 변경 | 원복 | must_pass |
| AUTH-009 | C-1 | P0 | e2e | has_password=true account | fresh magic link | 링크 클릭 | `/set-password`를 거치지 않고 허용된 next로 이동 | password 초기화 | context 폐기 | must_pass |
| AUTH-010 | C-1 | P0 | db/api | admin profile role=admin | admin relogin | 로그인/콜백 후 profile 조회 | role=`admin`, 기존 name/company 유지 | role=`applicant` overwrite | snapshot 원복 | must_pass |
| AUTH-011 | C-1 | P1 | e2e | 사용 완료/만료 link | — | 동일 링크 두 번째 클릭 | `/login?error=auth`; 세션 없음 | 인증 성공 | context 폐기 | must_pass |
| AUTH-012 | C-1 | P2 | contract | TEST_MAGIC_EMAIL | 60초 내 동일 요청 2회 | 두 번째 요청 | 읽을 수 있는 rate-limit 문구; provider 요청 최대 1건 | raw provider error/stack | inbox 정리 | must_pass |
| AUTH-013 | C-1 | P1 | e2e | student logged in | — | logout UI 클릭 후 `/portal/cohort` | `/login`; auth cookie 제거 | back 버튼으로 보호 화면 노출 | context 폐기 | known_gap |
| AUTH-014 | C-1 | P0 | e2e | has_password=false session | — | 주소창에서 `/portal/cohort` 직접 접근 | `/set-password?next=%2Fportal%2Fcohort` | LMS 렌더 | 신규 user 삭제 | known_gap |
| ACC-001 | 1.7,RBAC | P0 | e2e | guest | public routes | `/`, `/program`, `/apply`, `/apply/status`, `/trends`, `/login` 순회 | 각 요청 최종 경로 동일, 본문 marker visible | 로그인 강제 | 없음 | must_pass |
| ACC-002 | 1.7,RBAC | P0 | e2e | guest | protected routes | `/portal/cohort`, `/portal/sessions`, `/portal/billing`, `/admin`, `/alumni` 순회 | `/login`; `/admin`은 next 보존 | 보호 본문 노출 | 없음 | must_pass |
| ACC-003 | D-1~D-29 | P0 | e2e | student=in_training | LMS routes | cohort/chat/ai/assignments/sessions/files/builds/tasks/roadmap 순회 | 정의된 허용 route에 머물고 고유 DOM marker visible | 빈 200/404 | 없음 | must_pass |
| ACC-004 | E-7,E-11 | P0 | e2e | alumni_member | archive routes | `/portal/sessions`, `/portal/files`, `/alumni/archive` | 접근 허용; membership badge `멤버십 이용 중` | chat/AI 허용 | 없음 | must_pass |
| ACC-005 | E-11 | P0 | e2e | alumni_expired | `/alumni/archive`, `/portal/sessions` | 두 경로 접근 | archive는 locked UI 또는 membership으로 이동; 재생/다운로드 action 없음 | 자료 URL 노출 | 없음 | must_pass |
| ACC-006 | RBAC | P0 | e2e | applicant | protected routes | cohort/billing/admin 접근 | `/` 또는 `/apply`; admin body 미노출 | redirect loop | 없음 | must_pass |
| ACC-007 | C-4,US-07 | P0 | e2e/api | assistant linked to student | student cohort routes | LMS/tasks 접근 | 연결 cohort만 접근; 다른 cohort 403/빈 결과 | 모든 cohort 접근 | 없음 | must_pass |
| ACC-008 | H-* | P0 | e2e | non-admin roles | `/admin`, `/admin/applications`, `/admin/ai`, `/admin/billing` | 각 role로 직접 접근 | admin route 본문 0건; 지정 안전 경로 redirect | RSC payload에 admin 데이터 | 없음 | must_pass |
| ACC-009 | H-* | P0 | e2e | admin | admin routes | 위 4개 경로 접근 | 각 최종 경로 동일; 페이지 고유 제목 visible | 404/redirect | 없음 | must_pass |
| ACC-010 | 1.7 | P0 | db/e2e | student enrollment snapshot | status=`dropped` | 상태 변경→새 context로 `/portal/cohort` | `/portal/billing`; DB status dropped | 기존 상태 잔존 | original status 원복+assert | must_pass |
| ACC-011 | 1.7 | P0 | db/e2e | student enrollment snapshot | status=`completed` | 상태 변경→alumni/chat 접근 | `/alumni` 허용; chat 차단 | 양쪽 모두 허용 | original status 원복+assert | must_pass |
| ACC-012 | E-11 | P0 | db/e2e | alumni_member membership snapshot | status=`expired` | 변경→sessions 접근 | membership 유도; video/material marker 0건 | archive 콘텐츠 노출 | original status 원복+assert | must_pass |
| ACC-013 | RBAC | P1 | e2e | student | viewport 390x844 | `/portal/cohort` | 모바일 탭 visible; 가로 overflow 0 | admin 메뉴 노출 | 없음 | must_pass |
| ACC-014 | RBAC | P1 | e2e | alumni_member | viewport 390x844 | alumni/archive 화면 | 허용 메뉴만 visible; chat/AI 탭 없음 | 클릭 후 billing으로 튕기는 금지 메뉴 | 없음 | known_gap |
