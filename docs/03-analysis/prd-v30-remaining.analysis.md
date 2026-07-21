# prd-v30-remaining Gap Analysis (PDCA Check)

- **Date**: 2026-07-21 · **Method**: Static only (테스트 인프라 없음) · Formula: Structural×0.2 + Functional×0.4 + Contract×0.4
- **Design**: [prd-v30-remaining.design.md](../02-design/features/prd-v30-remaining.design.md)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 지원 전 확신·결제 병목·ROI 증명·결석 이탈·로드맵 실행수단·수료 후 단절 |
| **WHO** | 비로그인 방문자 · 합격 CEO · 수강생 · assistant · 멤버십 동문 |
| **RISK** | RLS 없이 배포 금지 · enrollments UPDATE는 admin 전용(학생 status 조작 방지) |
| **SUCCESS** | build+tsc 통과 · 6화면 · RLS 동반 배포 · Vercel 반영 |
| **SCOPE** | F1 /program · F2 billing 위임 · F3 /portal/builds · F4 따라잡기 · F5 /portal/roadmap · F6 /alumni/archive |

## Overall: 97% ✅ (기준 ≥90)

| Axis | Weight | Score |
|------|:------:|:-----:|
| Structural | 0.2 | 100% |
| Functional | 0.4 | 97% |
| Contract | 0.4 | 95% |
| **Overall** | — | **97%** |

## Axis Detail

- **Structural 100%**: Design §2의 15개 파일 전부 실구현 존재(신규 9·수정 6, 스텁 없음). next build 라우트 테이블에 /portal/builds·/portal/roadmap·/alumni/archive 신규 노출, tsc 0 에러.
- **Functional 97%**: §4 체크리스트 38개 중 37 구현 — F1 7/7 · F2 6/6 · F3 7/7 · F4 4.5/5 · F5 6.5/7 · F6 6/6.
- **Contract 95%**: session_catchups·roadmaps upsert(onConflict) 일치, builds insert/update 필드·RLS with check 일치, /program 공개 builds 페치가 builds_read 정책과 일치, 아카이브 페치는 RLS 확장(has_active_membership)과 일치. set_billing_delegate rpc 시그니처·검증·grant 일치.

## Check 중 발견·수정한 결함 (Critical → 해소)

| # | 결함 | 수정 |
|---|---|---|
| C1 | **위임 저장이 RLS에 막힘** — enrollments UPDATE 정책이 admin 전용이라 CEO의 billing_delegate_email 갱신이 실패. 반대로 일반 UPDATE 정책을 열면 학생이 자기 enrollment.status를 조작할 수 있는 보안 구멍 | security definer 함수 `set_billing_delegate(p_enrollment_id, p_email)` 신설(본인 소유 검증 + email 형식 검증 + 해당 컬럼만 갱신), 클라이언트는 rpc 호출로 변경. Design §3·§5 반영 완료 |

## 잔여 Gaps

Critical: 없음 · Important: 없음

| # | Minor | 내용 · 처리 |
|---|---|---|
| M1 | F4 체크리스트의 영상·자료 항목에 페이지 내 앵커 링크 없음 (힌트 문구로 대체) | 백로그 — 같은 화면 안이라 UX 영향 낮음 |
| M2 | F5 발표 모드가 스크롤 문서형(단계별 목차 네비 미구현) | 백로그 — 4단계 규모에서는 스크롤로 충분 |
| M3 | sessions_read 정책은 기존과 동일하게 재생성 — is_published가 이미 전체 공개라 멤버십 절이 불필요했음 | Design 의도와 다르나 결과 동일. videos/materials에는 멤버십 절 정상 추가 |

## 판정

SC-3(≥90%) 충족 · Critical/Important 0건 — **iterate 불필요, Act 진행**.
