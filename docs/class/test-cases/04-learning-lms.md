# 04. Learning and LMS

| ID | PRD | Pri | Layer | Preconditions | Test data | Steps | Assertions | Forbidden | Cleanup | Gate |
|---|---|---:|---|---|---|---|---|---|---|---|
| LMS-001 | D-1,D-23 | P0 | e2e | student, cohort18 seed | — | `/portal/cohort` | `My Build`, 이번 주 세션, 해야 할 일, 공지/AI 진입점 visible; 데이터가 student cohort와 일치 | 다른 cohort 카드 | 없음 | must_pass |
| LMS-002 | D-2 | P0 | e2e/db | student, 10 regular sessions seed | sort_order 1..10 | `/portal/sessions` | 10회가 sort_order 순; 날짜/제목/타입 일치 | 중복/누락 session | 없음 | must_pass |
| LMS-003 | D-3 | P0 | e2e | demoSession + video.url | — | 세션 상세→재생 | YouTube iframe 존재; title/읽기전용 표시; player 오류 없음 | 수정/삭제 control 노출 | 없음 | must_pass |
| LMS-004 | D-3 | P1 | e2e | video 없는 session seed | — | 세션 상세 | `아직 강의 영상이 업로드되지 않았습니다` | 깨진 iframe | seed 삭제 | must_pass |
| LMS-005 | D-3 | P1 | e2e | mp4 video seed | `https://example.com/qa.mp4` | 상세 열기 | native video controls; src 정확히 일치 | iframe으로 오분류 | seed 삭제 | must_pass |
| LMS-006 | D-3 | P1 | e2e | Drive URL video seed | drive file URL | 상세 열기 | drive preview iframe; 다운로드/편집 UI 없음 | manage 권한 노출 | seed 삭제 | must_pass |
| LMS-007 | D-22 | P0 | e2e | YouTube player ready | timestamp `41:20` | 출처 칩 클릭 | seekTo 2480초 호출; 재생 명령; 오차 ±2초 | 페이지 reload | 없음 | must_pass |
| LMS-008 | D-5 | P0 | e2e/db | demoSession + 2 materials | material titles/versions | 상세 열기 | 두 제목과 version visible; 링크 target `_blank`; href DB와 일치 | raw storage admin path | 없음 | must_pass |
| LMS-009 | D-5 | P0 | api | applicant/alumni_no_member | materials endpoint/select | 조회 | 빈 결과 또는 403; file_path 미노출 | signed/public URL 반환 | 없음 | must_pass |
| LMS-010 | D-6 | P0 | e2e/db | assignment seed, future deadline | text/url/file fixture | 과제 제출 | submission 1행; user/cohort/assignment 일치; UI 제출완료; 새로고침 유지 | 다른 user로 저장 | submission/file 삭제 | known_gap |
| LMS-011 | D-6 | P0 | contract | deadline clock-24h | T-05 | reminder job 실행 | 대상 미제출 student에 1건; 제출자 0건; deadline 포함 | 중복 발송 | outbox 삭제 | known_gap |
| LMS-012 | D-9 | P0 | e2e/contract | admin, notice seed | `QA-${RUN_ID} 공지` | 공지 발행+알림 선택 | student home/chat에 공지; T-07 1건; 다른 cohort 0건 | 전체 사용자 발송 | notice/outbox 삭제 | known_gap |
| LMS-013 | D-16 | P0 | e2e/db | student | `QA-${RUN_ID} chat` | 대화방 메시지 전송→새로고침 | messages 1행; 작성자/본문/cohort 일치; 새로고침 후 visible | client state만 저장 | message 삭제 | known_gap |
| LMS-014 | D-18,D-26 | P0 | contract/api | student+linked assistant, Drive sandbox | qa file | 파일 업로드/다운로드/rename; video 폴더 권한 확인 | chat 폴더 student/assistant read-write; video folder read-only; external share false | video delete/permission change | Drive 파일/권한 삭제 | known_gap |
| LMS-015 | D-10 | P0 | e2e/db | student, demoSession | question.body | 질문 전송 | session_questions 1행; author/cohort/session/body 일치; 목록 최상단; count +1 | 공백 질문 insert | question 삭제 | must_pass |
| LMS-016 | D-10 | P0 | api | applicant/alumni token | question.body | askQuestion 직접 호출 | 403/RLS error; insert 0건 | 질문 생성 | 없음 | must_pass |
| LMS-017 | D-10 | P0 | e2e/db | admin, LMS-015 question | answer.body | 답변 등록 | answer 1행; is_instructor=true; is_ai=false; `강사` badge | student badge | answer/question 삭제 | must_pass |
| LMS-018 | D-10 | P0 | e2e/db | second student, LMS-015 | answer.body | 동료 답변 | is_instructor=false; is_ai=false; `수강생` 표시; created_at 오름차순 | instructor=true | answer/question 삭제 | must_pass |
| LMS-019 | US-08 | P1 | e2e/db | absent student + demoSession | catchup booleans | 세션 상세에서 시청→자료→과제→AI 4단계 체크 | session_catchups upsert 1행; 각 체크 즉시 저장; 모두 true면 completed_at non-null | 결석 아닌 user에 자동 표시 | catchup 삭제 | must_pass |
| LMS-020 | US-08 | P1 | api | student A/B | A catchup id, B token | B가 A 행 select/update | 빈 결과/403; A 행 unchanged | 타인 progress 노출 | seed 삭제 | must_pass |
| LMS-021 | D-28 | P0 | e2e/db | admin, session snapshot | title=`QA-${RUN_ID} 특강` | 인라인 편집 저장 | sessions 변경; change_logs 1행; student 새로고침에 새 제목 | change log 없음 | session 원복, log 삭제 | must_pass |
| LMS-022 | D-29 | P0 | e2e/db | admin | type=special, sort position 3 | 세션 삽입→순서 변경→새로고침 | session 1행; type special; sort_order 유지; regular session count=10 | 수료 기준 regular count 증가 | session/log 삭제 | must_pass |
| LMS-023 | D-28 | P0 | e2e/db | admin, demoSession | material.title/url | 자료 추가→student 확인→삭제 | insert/delete DB 반영; student UI 즉시 일치 | 삭제 후 링크 접근 | material 삭제 | must_pass |
| LMS-024 | D-21,G-7 | P0 | contract/db | admin, video 없는 session | video.url | 영상 연결 | videos upsert; 대상 cohort student/assistant 알림톡+email+chat 공지 각 1건; session명/link 포함 | 타 cohort 발송 | video/outbox/message 삭제 | known_gap |

