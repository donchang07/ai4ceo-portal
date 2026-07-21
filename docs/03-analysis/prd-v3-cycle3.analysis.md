# prd-v3-cycle3 Gap Analysis (PDCA Check)

- **Date**: 2026-07-21 · **Method**: Static only (테스트 인프라 없음) · Formula: Structural×0.2 + Functional×0.4 + Contract×0.4
- **Design**: [prd-v3-cycle3.design.md](../02-design/features/prd-v3-cycle3.design.md)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | F-1·F-5·F-6(트렌드 본문 열람 화면 부재) · D-10(일반 Q&A 게시판 부재) |
| **WHO** | 비로그인 방문자·수강생·동문·admin(트렌드) · 재학생·assistant·admin(Q&A) |
| **RISK** | `session_questions.session_id` nullable 전환이 기존 세션별 Q&A(D-22)에 영향 없어야 함 |
| **SUCCESS** | build+tsc 통과, Check ≥90% |
| **SCOPE** | `/trends/[slug]`, `/portal/qna` |

## Overall: 95% ✅ (기준 ≥90)

| Axis | Weight | Score |
|------|:------:|:-----:|
| Structural | 0.2 | 100% |
| Functional | 0.4 | 93% |
| Contract | 0.4 | 95% |
| **Overall** | — | **95%** |

## Axis Detail

- **Structural 100%**: Design §2의 10개 파일(신규 7·수정 3) 전부 실구현. next build 라우트 테이블에 `/trends/[slug]`·`/portal/qna` 노출, tsc 0 에러.
- **Functional 93%**: F1 — audience 4종(public/student/alumni/admin_only) 게이트 전부 구현, 잠금 시 목록과 동일 톤의 티저 렌더, 목록 카드 제목 링크 연결. F2 — 질문 등록·답변·AI 조교 답변·강사 배지 전부 구현. 0.07 감점: F2에 알림톡(T-06) 미연동 — Design §4에서 "세션 Q&A도 미연동 상태라 일관성 유지"로 의도적 제외했으나 PRD 원문(D-10)은 "답변 등록 시 알림톡 T-06 재사용"을 명시하므로 엄밀히는 갭.
- **Contract 95%**: `getPost`/`getGeneralQuestions` 반환 형태가 화면 소비 형태와 일치. `session_questions.session_id` nullable 전환 후에도 RLS(`sq_read`/`sq_insert`/`sa_read`/`sa_insert`)가 전부 `cohort_id` 기준이라 무변경 확인(마이그레이션 전 재검증 완료). 0.05 감점: `askGeneralQuestion`/`askQuestion`(세션별) 두 액션 파일이 거의 동일한 insert 로직을 중복 보유 — Design D-5에서 의도적으로 분리했으나 향후 리팩터링 여지.

## Check 중 확인한 결함

없음(Critical/Important 0건).

| # | Minor | 내용 · 처리 |
|---|---|---|
| M1 | `/portal/qna` 답변 등록 시 알림톡 T-06 미연동 | PRD D-10 원문 명시 사항이나, 세션별 Q&A도 동일하게 미연동 상태(기존 기술 부채) — 두 곳을 함께 연결하는 별도 사이클로 백로그 |
| M2 | 세션/일반 Q&A 액션 로직 중복 | 의도된 분리(회귀 위험 제거)이나 장기적으로 공용 헬퍼로 추출 여지 |

## 판정

SC-1~4 충족. Critical/Important 0건 — **iterate 불필요, Act 진행**.
