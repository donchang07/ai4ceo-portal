# diff3 — PRD v2.7 (docx) → PRD v2.8.3 변경 내역

- 비교 대상: `ai4ceo-portal-PRD-v2_7.docx` → [prd v.2.8.3.md](prd%20v.2.8.3.md)
- 작성일: 2026-07-20
- 참고: 이전 실행분 diff2.md(v2.8.1→v2.8.2, 유저 스토리 5개 기반)와 별개. 본 diff는 v2.7 원문 대비 이번 재도출(유저 스토리 10개)의 변경만 기록한다.

## 1. 추가 (Added)

| # | 항목 | 내용 | 근거 |
|---|---|---|---|
| A-1 | 유저 스토리 10개 (US-01~10) | v2.7에는 유저 스토리 형식 요구사항이 없음(페르소나·여정만 존재). 잠재고객 2·지원자 1·등록 1·수강 4·수료 전 1·동문 1로 라이프사이클 전 구간 커버 | prd v.1.1의 P1~P5 + AX 유형 A/B/C |
| A-2 | 신규 화면 /portal/tasks | assistant 전용 위임 할 일(대기/진행/완료 상태 관리, 완료 알림). P1, M2~M4 | US-07 (P4 조직 온도 차) |
| A-3 | 신규 화면 /portal/roadmap | AX 로드맵 초안 작성·10주차 발표 모드. v2.7 KPI "AX 로드맵 초안 작성률 ≥70%"가 있었으나 달성 수단(화면)이 사이트맵에 없던 갭을 해소. P1, M3 | US-09 (P1·P5) |
| A-4 | 신규 화면 /alumni/archive | 멤버십 전용 전 기수 녹화본·교재 아카이브 + 브리프 진입점. P2, M4 | US-10 (P5 수료 후 단절) |
| A-5 | 신규 테이블 delegated_tasks | CEO↔assistant 위임 항목. RLS: CEO 본인·연결 assistant·admin | A-2의 데이터 모델 |
| A-6 | 신규 KPI 2개 | ① AI 에스컬레이션 후 24시간 내 해소율 ≥90% ② 결과물 회사 적용(파일럿 이상) 비율 ≥40%(확인 필요) | US-05, US-06 |

## 2. 업그레이드 (Upgraded)

| # | 화면 | v2.7까지 | v2.8.3 변경 | 근거 |
|---|---|---|---|---|
| U-1 | /program | 커리큘럼·강사·일정·보충 세션 정적 안내 | 5문항 자가진단 + 수료생 Build 미리보기 3건 + 경쟁 대안 비교 섹션(포지셔닝 3축) 추가 | US-01·02 (P1·P3) |
| U-2 | /apply/status | "미구현 확인, P1 백로그 유지" (v2.7 명시) | **P0 승격**. 매직링크 3단계 상태 조회 + 알림톡 T-01~03 연동 | US-03 (등록 퍼널) |
| U-3 | /portal/billing | 내 인보이스·세금계산서 요청 (본인만) | 결제 실무를 연결 assistant에게 위임(RLS 확장) + 위임 상태 배지 | US-04 (P4 위임) |
| U-4 | /portal/ai | AI 질문 답변 튜터 (D-19·D-25) | 막힘 에스컬레이션: 컨텍스트 자동 태깅 → 미해결 시 코칭·보충 원클릭 연결 → 강사 검수 큐 우선 노출. **P0, M2** | US-05 (P3 완주율 직결) |
| U-5 | /portal/builds | 결과물 등록·쇼케이스 (모듈 I, 배포 미확인) | 회사 적용 상태(검토중/파일럿/적용완료) + 효과 메모 필드 추가, 90일 성과설문(E-9) 사전 데이터화. 배포 여부 재확인 선행 | US-06 (P5 ROI 증명) |
| U-6 | /portal/sessions/[id] | 영상·영상 Q&A·자료·출석 | 결석자 따라잡기 체크리스트 4단계 + 출석 보완 기록 | US-08 (P3) |
| U-7 | /admin/applications | 선발 관리 | 상태 전환 시 /apply/status 반영·알림톡 트리거 명시 | U-2의 운영 짝 |
| U-8 | /admin/ai | AI 질문 로그·검수 | "AI 미해결(에스컬레이션)" 필터 추가 | U-4의 운영 짝 |

## 3. 승계 (Unchanged)

- v2.7 사이트맵 37개 라우트 중 위 표에 없는 나머지 전부 무변경 승계 — /, /trends, /trends/[slug], /apply, /login, /portal, /portal/cohort, /portal/sessions, /portal/assignments, /portal/coaching, /portal/supplement, /portal/chat, /portal/qna, /alumni, /alumni/profile, /alumni/directory, /alumni/membership, /alumni/[profileSlug], /admin 이하 나머지 전부
- 8장 마일스톤 골격(M0~M4), 9장 알림톡 템플릿 15종, 10장 KPI 기존 목표치 전부 승계 (신규 KPI 2개만 추가)
- 1.7 상태 기반 화면 개방(Status-gated UX) 원칙 승계 — 신규 화면 3개 모두 이 원칙 적용: /portal/tasks·/portal/roadmap은 enrolled 이상, /alumni/archive는 membership active

## 4. 수정·정정 (Modified)

| # | 항목 | 내용 |
|---|---|---|
| M-1 | /apply/status 우선순위 | P1 백로그 → P0 (M1). v2.7의 "미구현 유지" 결정을 뒤집음 — 지원자 경험(US-03)과 모집 퍼널 계측을 근거로 |
| M-2 | AX 로드맵의 위치 | v2.7에서는 KPI로만 존재 → 전용 화면(/portal/roadmap)으로 실체화 |

## 5. 오픈 이슈 (구현 전 확인)

1. 모듈 I(/portal/builds) 배포 여부 재확인 — v2.7 실사에서 미확인 상태
2. 결과물 회사 적용 비율 KPI 목표치(≥40%)는 17기 실측 후 확정 (확인 필요)
3. delegated_tasks 테이블 마이그레이션 + RLS 정책 신규 작성 필요 (CLAUDE.md 규칙: RLS 없이 배포 금지)
4. 이전 실행분 prd v.2.8.2.md와의 문서 통합 여부 — 두 버전의 신규 화면이 일부 겹침(/portal/tasks, /alumni/archive는 양쪽 모두 도출됨 → 수요 신호 강함)
