# 09. PRD v3.0 traceability

상태 정의: `covered`는 실행 가능한 assertion이 존재, `partial`은 일부 하위 요구만 검증, `gap`은 구현 또는 테스트 fixture가 없어 known-gap 케이스만 존재한다.

## Modules A-C

| PRD | Priority | Cases | Status | Note |
|---|---:|---|---|---|
| A-1 | P0 | PUB-001 | partial | 공개 쇼케이스는 BUILD-004/SEC-014와 결합 필요 |
| A-2 | P0 | PUB-002 | covered | 개강일은 PRD `2026-09-07` 기준 |
| A-3 | P0 | PUB-003 | covered | `/program` 통합 FAQ |
| A-4 | P1 | PUB-001,SEC-014 | partial | 후기 실데이터 seed 필요 |
| A-5 | P0 | PUB-004 | gap | OG/sitemap 구현 확인 필요 |
| B-1 | P0 | ADM-014 | gap | cohort CRUD 전용 케이스 추가 필요 |
| B-2 | P0 | APP-001~004 | partial | PRD의 `AI 활용 현황` 필드가 현재 폼에 없음 |
| B-3 | P0 | APP-005~006 | partial | 접수번호는 UI 생성, 알림은 gap |
| B-4 | P0(v3) | APP-009~014 | covered | email+phone RPC 구현 기준 |
| B-5 | P0 | ADM-002~003 | covered | 메모 필드는 추가 케이스 필요 |
| B-6 | P0 | ADM-004 | gap | 초대/인보이스/알림 후속 미완 |
| B-8 | P0 | APP-007~008 | partial | 추천 대시보드는 J-3 gap |
| C-1 | P0 | AUTH-001~012 | covered | OAuth는 범위 외, magic link/password 검증 |
| C-2 | P0 | ENR-001 | gap | 프로필+서약 플로우 필요 |
| C-3 | P0 | ENR-002 | gap | OT 알림 계약 필요 |
| C-4 | P0 | ENR-003~004,ACC-007 | gap | assistant 초대/해제 미완 |
| C-5 | P0 | BILL-001 | partial | 자동 발행은 ADM-004 gap |
| C-6 | P0 | BILL-005~006 | covered | DB/알림/멱등성 포함 |
| C-7 | P0 | BILL-004 | gap | 요청 폼·업로드 필요 |
| C-8 | P1 | BILL-007~008 | gap | Toss 계약 구현 후 활성화 |
| C-9 | P0 | BILL-003 | gap | href 미연결 시 실패 |
| C-10 | P1 | BILL-009~010 | gap | Popbill mock/실전환 계약 |

## Modules D-E

| PRD | Priority | Cases | Status | Note |
|---|---:|---|---|---|
| D-1 | P0 | LMS-001 | covered | Cohort Home 핵심 카드 |
| D-2 | P0 | LMS-002,ADM-005~007 | covered | 세션·정렬·편집 |
| D-3 | P0 | LMS-003~006,ADM-009 | covered | YouTube/mp4/Drive |
| D-4 | P1 | — | gap | video_progress/이어보기 케이스 필요 |
| D-5 | P0 | LMS-008~009,LMS-023 | covered | 자료 CRUD/RLS |
| D-6 | P0 | LMS-010~011 | gap | 제출/24h 알림 구현 필요 |
| D-7 | P1 | — | gap | 과제 피드백/알림 케이스 필요 |
| D-8 | P1 | — | gap | 출석/QR/집계 케이스 필요 |
| D-9 | P0 | LMS-012 | gap | 공지 저장/알림/대화방 게시 |
| D-10 | P1 | LMS-015~018 | covered | 질문·강사·동료 답변/RLS |
| D-11 | P1 | — | gap | 리소스 허브 화면/권한 케이스 필요 |
| D-12 | P0 | AI-012 | partial | 코칭 예약 자체는 gap |
| D-13 | P0 | AI-012 | partial | 보충 세션 신청/정원/알림 gap |
| D-14 | P0 | ADM-014 | gap | 기수 템플릿 복제 |
| D-15 | P0 | LMS-021,ADM-005~007 | covered | change_logs 포함 |
| D-16 | P0 | LMS-013 | gap | 현재 chat 영속 여부가 게이트 |
| D-17 | P1 | AI-010,LMS-012 | gap | 메시지 승격/연결 |
| D-18 | P0 | LMS-014 | gap | Drive sandbox 필요 |
| D-19 | P0 | AI-001~009 | covered | 권한·RAG·문맥·스트림 |
| D-20 | P1 | AI-010 | gap | 저장/승격/신고 |
| D-21 | P0 | LMS-024 | gap | 3채널 알림 |
| D-22 | P1 | LMS-007,AI-011 | partial | seek는 covered, transcript RAG gap |
| D-23 | P0 | LMS-001 | partial | 역할별 카드 전체는 확장 필요 |
| D-24 | P0 | ADM-014 | gap | version pack 관리 |
| D-25 | P0 | AI-003,AI-012 | covered | contextual input/escalation |
| D-26 | P0 | LMS-014,ADM-015 | gap | Drive permission contract |
| D-27 | P1 | — | gap | 강의평가/NPS 집계 케이스 필요 |
| D-28 | P0 | LMS-021,LMS-023,ADM-005 | partial | 예약 공개와 자동 RAG 재인덱싱 gap |
| D-29 | P0 | LMS-022,ADM-006~007 | covered | special/순서/수료기준 |
| E-1 | P0 | ACC-011 | partial | 수료 기준 계산/일괄 처리/알림 gap |
| E-2 | P1 | — | gap | PDF 수료증 |
| E-3 | P1 | — | gap | 만족도/NPS |
| E-4 | P0 | ACC-004~005 | partial | AS Q&A CRUD/SLA gap |
| E-5 | P1 | — | gap | 오피스아워 예약 |
| E-6 | P1 | SEC-014 | partial | 프로필 작성/공개범위 변경 gap |
| E-7 | P0 | ACC-004~005 | covered | membership 정책과 함께 검증 |
| E-8 | P2 | — | gap | 재교육 안내 |
| E-9 | P1 | BUILD-003 | partial | 90일 자동 설문/리마인더 gap |
| E-10 | P1 | SEC-014 | partial | 디렉토리 필터/연락처 동의 gap |
| E-11 | P1 | MEM-001~003,ARCH-001~004 | covered | 가격/상태/아카이브/RLS |

## Modules F-J and v3 stories

| PRD | Cases | Status | Note |
|---|---|---|---|
| F-1 | ADM-011,ARCH-001 | covered | 발행/audience/archive |
| F-2~F-4 | PUB-004 | gap | 뉴스레터/구독/분석 별도 계약 필요 |
| F-5 | ADM-011 | covered | admin-only CRUD |
| F-6 | ADM-011,ARCH-001 | partial | 공개/student/alumni 피드 분기 확장 필요 |
| G-1~G-7 | APP-006,ENR-002,LMS-011~012,LMS-024,ADM-004 | gap | outbox/provider 계약은 있으나 구현 다수 미완 |
| H-1 | ADM-001 | covered | 실 DB KPI |
| H-2 | ADM-013 | gap | 회원 관리 route 필요 |
| H-3 | ADM-002~004 | partial | 상태·검색 covered, 후속 gap |
| H-4 | ADM-010 | covered | 결제 DB 기준 |
| H-5~H-9 | ADM-011,LMS-012~014 | gap | 알림로그/리포트/보충/템플릿/채팅 관리 확장 필요 |
| H-10 | AI-013,ADM-012 | partial | 검수/재답변 action gap |
| H-11 | ADM-009,LMS-024 | partial | 연결 covered, 알림/자막상태 gap |
| H-12 | SEC-014 | gap | 공개 프로필 관리자 moderation |
| H-13 | ADM-014 | gap | version pack |
| H-14 | ADM-015 | gap | Drive permission admin |
| I-1 | BUILD-001 | covered | 결과물 등록 |
| I-2 | — | gap | cohort showcase reaction/comment |
| I-3 | BUILD-004,SEC-014 | covered | opt-in public visibility |
| I-4 | BUILD-002~003 | partial | 수료 기준/KPI 집계 연결 gap |
| J-1~J-3 | APP-007~008 | partial | 발급·귀속·성과 대시보드 중 귀속만 covered |
| US-01 | PUB-005 | gap | 자가진단/Build preview |
| US-02 | PUB-006 | gap | 비교 섹션 |
| US-03 | APP-009~014,ADM-003~004 | covered | 상태조회/전환, 알림은 known gap |
| US-04 | BILL-011~012 | covered | billing delegation/RLS |
| US-05 | AI-003,AI-012~013 | covered | contextual/escalation/admin queue |
| US-06 | BUILD-001~005 | covered | 적용상태/효과메모/RLS |
| US-07 | TASK-001~004,ACC-007 | covered | 위임 CRUD/status/RLS |
| US-08 | LMS-019~020 | covered | 4단계 catchup/RLS |
| US-09 | ROAD-001~004 | covered | roadmap/Build 연결/RLS |
| US-10 | ARCH-001~004 | covered | membership archive/filter/RLS |

## Release decision

- `covered` P0가 모두 통과해야 배포 가능하다.
- P0 `partial` 또는 `gap`은 제품 오너가 scope-out 결정을 문서화하지 않는 한 출시 차단이다.
- 구현되지 않은 P0를 테스트 문서에서 삭제하거나 `manual`로 숨기지 않는다.

