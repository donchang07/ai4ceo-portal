# 06. PRD v3.0 workflows

| ID | PRD | Pri | Layer | Preconditions | Test data | Steps | Assertions | Forbidden | Cleanup | Gate |
|---|---|---:|---|---|---|---|---|---|---|---|
| TASK-001 | US-07 | P1 | e2e/db | student + linked assistant | task.* source=assignment | `/portal/tasks`에서 새 위임 | delegated_tasks 1행; ceo_user_id/student, assistant_email, title/note/source_type, status=`pending`; 목록 최상단 | 미연결 assistant 허용 | task 삭제 | must_pass |
| TASK-002 | US-07 | P1 | e2e/db | TASK-001, assistant session | — | 상태 버튼 두 번 클릭 | pending→in_progress→done; DB와 배지 일치; 새로고침 유지 | 다른 task 변경 | task 삭제 | must_pass |
| TASK-003 | US-07 | P0 | api | student A/B, assistant links | A task id, B token | select/update | A와 연결 assistant만 조회/수정; B 빈 결과/403 | 전체 task 노출 | task 삭제 | must_pass |
| TASK-004 | US-07 | P1 | e2e | student | 빈 title, invalid assistant email | 위임 시도 | `제목을 입력해 주세요.`/`assistant 이메일을 확인해 주세요.`; insert 0건 | 일반 실패문구만 | 없음 | must_pass |
| BUILD-001 | I-1,US-06 | P0 | e2e/db | student cohort18 | build.* | 결과물 등록 | builds 1행; user/cohort/title/description/repo_url 일치; apply_status=`none`; 카드 visible | 다른 user 귀속 | build 삭제 | must_pass |
| BUILD-002 | US-06 | P1 | e2e/db | BUILD-001 | 상태 review→pilot→applied | 각 chip 클릭 | DB apply_status 정확히 변경; badge `검토 중`/`파일럿`/`적용 완료`; reload 유지 | UI만 변경 | build 삭제 | must_pass |
| BUILD-003 | US-06 | P1 | e2e/db | BUILD-001 | build.effectMemo | 효과 메모 저장 | effect_memo 정확히 저장; reload 후 동일 | trim 외 데이터 손실 | build 삭제 | must_pass |
| BUILD-004 | I-3 | P1 | e2e/db | BUILD-001 | visibility cohort/public | 공개 switch 두 번 | aria-checked와 DB visibility 일치; public일 때만 공개 쇼케이스 query 대상 | private/cohort 결과 공개 | build 삭제 | must_pass |
| BUILD-005 | I-1,SEC | P0 | api | student A/B | A build id, B token | select/update | B가 A build를 조회/수정하지 못함 | 다른 user effect_memo 노출 | build 삭제 | must_pass |
| ROAD-001 | US-09 | P1 | e2e/db | student | roadmap.* | `/portal/roadmap` 4단계 입력·저장 | roadmaps 1행/user unique; 4개 text 필드 정확히 저장; status=`draft`; 단계 이동 시 유지 | 중복 roadmap | roadmap 삭제 | must_pass |
| ROAD-002 | US-09 | P1 | e2e/db | ROAD-001 + BUILD-001 | selected build id | Build 연결→저장 | build_ids에 정확히 1개; 타 user build 선택 불가 | 임의 UUID 저장 | roadmap/build 삭제 | must_pass |
| ROAD-003 | US-09 | P1 | e2e/db | ROAD-001 complete | — | 최종 확정/발표 모드 | status=`final`; 전체화면 발표에 4단계와 연결 Build 표시 | 필수 단계 빈 final | roadmap 삭제 | must_pass |
| ROAD-004 | US-09,SEC | P0 | api | student A/B | A roadmap id, B token | B select/update | 빈 결과/403; A 데이터 unchanged | 진단/계획 노출 | roadmap 삭제 | must_pass |
| ARCH-001 | US-10,E-11 | P2 | e2e/db | alumni_member, posts seed 15/16/17기 | category/tags | `/alumni/archive` 필터 | `멤버십 이용 중`; 기수 필터 결과가 category/tag와 정확히 일치; 읽기 action enabled | 18기 진행 콘텐츠 노출 | posts 삭제 | must_pass |
| ARCH-002 | US-10,E-11 | P0 | e2e | alumni_expired | same posts | archive 접속 | `멤버십 만료`; `멤버십 갱신`; 모든 item에 lock; external link action 없음 | href로 원문 접근 | posts 삭제 | must_pass |
| ARCH-003 | US-10 | P1 | e2e/db | alumni_member, no posts | — | archive 접속 | `아직 공개된 아카이브 콘텐츠가 없습니다`; error UI 없음 | mock cards 표시 | 없음 | must_pass |
| ARCH-004 | E-11,SEC | P0 | api | applicant/student/alumni tokens | alumni-only post | posts select | active member/admin만 private archive row; public post 정책은 별도 유지 | expired/applicant에 alumni row | posts 삭제 | must_pass |

