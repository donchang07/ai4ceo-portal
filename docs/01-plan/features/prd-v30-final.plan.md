# prd-v30-final Plan (PDCA Plan)

- **Date**: 2026-07-21 · **PRD 정본**: `ai4ceo-portal-PRD-v3_0.docx` §7.3(화면정의)·§9(알림톡)
- **선행 사이클**: prd-v283-core, prd-v30-remaining(롤백됨) · main 자체 구현(5d61526, docx-commit c1b3d79)
- **전제**: docx §7.3의 v3.0 핵심 변경 11건 중 9건은 main에 이미 구현·검증됨(코드-PRD 대조 완료). 본 사이클은 **잔여 갭만** 다룬다 — 신규 라우트 추가나 재구현이 아니다.

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | US-01·02(지원 전 확신) 미해결, US-10(동문 아카이브)의 "녹화본·교재" 부분 미해결, T-01~03 알림톡이 UI 문구로만 존재하고 실제 트리거 없음 |
| **WHO** | 비로그인 방문자(자가진단) · 지원자(알림톡) · 멤버십 동문(아카이브) |
| **RISK** | 알림톡 실채널(카카오 비즈니스) 미가입 — 실발송 불가. archive는 videos/materials RLS가 이미 멤버십 확장돼 있어(라이브 DB 확인됨) 코드만 필요 |
| **SUCCESS** | build+tsc 통과, Check ≥90%, main 직접 커밋·푸시, Vercel 배포 |
| **SCOPE** | F1 /program 자가진단·Build 미리보기·비교 섹션 · F2 /alumni/archive 녹화본·교재 탐색 · F3 지원 상태 전환 알림톡 실트리거(mock 채널) |

## Features

| # | 내용 | 근거 |
|---|---|---|
| F1 | `/program`에 5문항 자가진단(비저장) + 공개 Build 미리보기(최대 3건) + 경쟁 비교 3축 표 추가 | docx §7.3 US-01·02, P1·M1(모집 오픈 전 — 최우선) |
| F2 | `/alumni/archive`에 기수·주차별 **녹화 영상 링크 + 교재 다운로드** 목록 추가(기존 브리프 목록에 병렬 섹션으로) | docx §7.3 US-10, P2·M4 |
| F3 | `updateApplicationStatus`에 `notify()` 호출 연결 — accepted→T-02, rejected/waitlist→T-03 (T-01은 이미 apply 제출 시 존재 확인 필요, 없으면 추가) | docx §7.3 US-03, §9 템플릿 표 |

## 사전 결정 (질문 없이 진행)

| # | 결정 | 근거 |
|---|---|---|
| D-1 | Build 공개 미리보기는 `builds.visibility='public'` 재사용(직전 사이클과 동일 패턴) | 기존 RLS(`builds_read`)로 충분, 컬럼 추가 불필요 |
| D-2 | archive 영상·자료는 `sessions`(is_published) → `videos`/`materials` 조인. RLS는 이미 `has_active_membership()`로 확장돼 있음(라이브 DB 확인 완료, 2026-07-21 적용분) — **DB 변경 없음, 코드만 추가** | main의 `20260721000000_prd_v3_screens.sql` 계열이 이미 라이브 반영. 재확인 후 진행 |
| D-3 | 알림톡은 기존 `lib/notify` 엔진(`notify()`) 그대로 사용 — 카카오 채널 미가입이므로 `alimtalk` 채널은 현재도 no-op(콘솔 로그 + `notifications` 테이블 queued 기록)이며 이번 사이클도 이를 유지. **실채널 연동이 아니라 "트리거 배선"만** 한다 | docx가 요구하는 것은 "상태 전환 시 알림톡 연동"이며, 발송 인프라(Solapi/카카오)는 별도 오픈 이슈(11.2)로 이미 남아있음 |
| D-4 | T-01(지원 접수)은 `/apply` 제출 액션에 이미 있는지 먼저 확인 후, 없으면 추가 | 코드 확인 결과 없음 → F3에 포함 |

## Success Criteria

- **SC-1**: `/program`에 자가진단·Build 미리보기·비교 섹션 렌더, next build 통과
- **SC-2**: `/alumni/archive`에서 멤버십 active 동문이 과거 기수 영상·자료를 볼 수 있음(코드 레벨 검증, DB는 기존 RLS 재사용)
- **SC-3**: 지원 상태 accepted/rejected/waitlist 전환 시 `notify()`가 호출되어 `notifications` 테이블에 T-02/T-03 레코드 기록
- **SC-4**: Check 갭 분석 ≥90%
- **SC-5**: main 직접 push + Vercel 배포 확인
