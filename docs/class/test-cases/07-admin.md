# 07. Admin console

| ID | PRD | Pri | Layer | Preconditions | Test data | Steps | Assertions | Forbidden | Cleanup | Gate |
|---|---|---:|---|---|---|---|---|---|---|---|
| ADM-001 | H-1 | P0 | e2e/db | admin, known seed counts | applications/invoices counts | `/admin` | KPI가 DB count와 정확히 일치; 숫자 포맷만 허용 | 하드코딩 64/78/42 값 | seed 삭제 | must_pass |
| ADM-002 | H-3,B-5 | P0 | e2e/db | applications 3상태 seed | QA names/company/status | `/admin/applications` 검색·필터 | name/company 검색 정확; status chip 결과 ID 집합 일치 | 비대상 row 표시 | applications 삭제 | must_pass |
| ADM-003 | B-5 | P0 | e2e/db | received application snapshot | — | 상태 reviewing→accepted | DB status 각 단계 저장; UI badge; reload 유지; 변경 시각 존재 | local state만 변경 | snapshot 원복 | must_pass |
| ADM-004 | B-6,G-1 | P0 | contract/db | ADM-003 accepted transition | T-02 + invite + invoice | accepted 처리 | 알림 outbox 1건; 초대 링크 1개; invoice 1행/2200000; 동일 transition 재호출시 중복 0 | 화면 callout만 표시 | 생성 rows 삭제, status 원복 | known_gap |
| ADM-005 | D-2,D-28 | P0 | e2e/db | admin, session snapshot | title/body QA values | curriculum 편집 저장 | session 필드 일치; change_logs actor/before/after; student UI 갱신 | log 없음 | 원복/log 삭제 | must_pass |
| ADM-006 | D-29 | P0 | e2e/db | admin | special session fixture | `+ 세션 삽입` | 1행 생성; type=special; 지정 sort_order; 목록 visible | regular count 증가 | session/log 삭제 | must_pass |
| ADM-007 | D-29 | P0 | e2e/db | 3 session seed | order C,A,B | drag reorder→reload | DB sort_order와 UI가 C,A,B; 중복 sort_order 없음 | reload 원복 | 원래 순서 복원 | must_pass |
| ADM-008 | D-28 | P1 | e2e | admin | — | 미리보기 | 수강생 레이아웃 모달; 현재 draft 값 표시; DB 변경 없음 | 저장 없이 persist | 닫기 | must_pass |
| ADM-009 | H-11 | P0 | e2e/db | admin, session | video.url/title | 연결→교체→제거 | 같은 session videos 최대 1행; update 후 URL 변경; 제거 후 0행; student UI 각각 일치 | 중복 video 행 | 원본 video 복원 | must_pass |
| ADM-010 | H-4,C-6 | P0 | e2e/db | invoices seed | status pending/paid | `/admin/billing` 탭/입금확인 | DB 목록과 ID·금액·상태 일치; BILL-005 결과 | mock fallback을 실데이터처럼 표시 | seed 삭제 | must_pass |
| ADM-011 | F-1,F-5 | P0 | e2e/db | admin | post title/body/audience | 콘텐츠 작성→발행→수정→삭제 | posts CRUD; audience에 따른 `/trends` 노출; published_at | non-admin CRUD | post 삭제 | must_pass |
| ADM-012 | H-10,US-05 | P0 | e2e/db | escalated/general logs | — | `/admin/ai` | escalated만 최신순; exact 질문/작성자/회사/시간; empty state 문구 | 일반 로그/타 user 민감 context 과다노출 | logs 삭제 | must_pass |
| ADM-013 | H-2 | P0 | e2e/db | admin | user search fixture | 회원 관리 route 접근/검색/role-state 변경 | DB 영속; audit log; 안전한 상태 전이 | route 404, 무감사 변경 | 원복/log 삭제 | known_gap |
| ADM-014 | H-13 | P0 | e2e/db | cohort template seed | version label QA | version pack 복제·잠금 | sessions/assignments/material snapshot 개수 일치; source와 독립; locked 후 audit log | source cohort 변경 | pack/cohort 삭제 | known_gap |
| ADM-015 | H-14,D-26 | P0 | contract | Drive sandbox | permission fixtures | 권한 동기화/외부공유 감지 | chat RW, video RO, admin manage; 위반 이벤트 경고 1건 | 자동 public share | Drive fixtures 삭제 | known_gap |
| ADM-016 | NFR-security | P0 | e2e | admin account with TOTP | valid/invalid OTP | admin 로그인 | password 후 OTP 요구; invalid 거부; valid에만 admin 접근 | 비admin/OTP 없이 접근 | context 폐기 | known_gap |

