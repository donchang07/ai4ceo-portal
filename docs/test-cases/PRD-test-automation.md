# PRD — AI4CEO Portal 비즈니스 테스트 자동화 도구

문서 버전 v0.1 · 작성일 2026-07-19 · 대상: `apps/ai4ceo`

## 1. 배경 & 문제

이 포탈의 핵심 가치는 **역할·수강상태에 따라 보이는 화면을 차등**하는 것이고, 이것이 곧 매출
방어선이다(졸업생 멤버십, 재학생 전용 AI 조교 등). 수동 검증(02번 문서의 42개 매트릭스)은
배포마다 반복 불가능하고, 페이지를 추가할 때 게이트 호출을 빠뜨리면 조용히 뚫린다.

또한 상당수 화면이 아직 목업/부분구현이라(04·05번 문서), "무엇이 진짜 동작하는가"가 배포마다
바뀐다. 테스트 도구는 **회귀 방지**와 **구현 진척도 대시보드** 두 역할을 동시에 해야 한다.

## 2. 목표 (Success Criteria)

- SC-1: 02번 접근 매트릭스(5역할 × 13라우트 = 65셀)를 CI에서 자동 검증, 위반 시 배포 차단.
- SC-2: "재학생만 AI 조교" 같은 P0 보안 룰을 API 레벨(화면 없이)에서도 검증.
- SC-3: RLS 직접 공격 케이스(07번)를 실제 Supabase에 토큰별로 던져 자동 확인.
- SC-4: 목업/미구현 항목을 "의도된 실패(xfail)"로 표시해, 진짜 회귀와 구분.
- SC-5: 새 `/portal`·`/alumni` 페이지가 게이트 호출 없이 추가되면 정적 검사로 실패.
- SC-6: 전체 스위트 5분 내, PR마다 자동 실행.

## 3. 범위

포함: E2E(브라우저) 접근 매트릭스, API 계약 테스트(권한/RLS), 정적 게이트 린트, RAG 스모크,
시드/계정 프로비저닝. 제외: 시각 회귀(픽셀), 부하 테스트(별도), 결제사 실연동 테스트(키 확보 후).

## 4. 기능 요구사항

### 4.1 계정·시드 프로비저닝 (P0)
- FR-1: 5개 테스트 계정(README 표)을 idempotent하게 생성/갱신하는 스크립트.
  이미 `scripts/seed_test_users` 패턴 존재 — 이를 `scripts/test/provision.mjs`로 정식화.
- FR-2: 상태 변형 픽스처: 특정 계정의 enrollment.status·membership.status를 런타임에 바꾸고
  되돌리는 헬퍼(AC-32/33/34 같은 전이 테스트용). 각 테스트는 자기 상태를 setup/teardown.
- FR-3: 테스트 전용 cohort/데이터는 프로덕션과 분리된 **Supabase 프리뷰 브랜치** 또는 전용
  test 프로젝트에서 실행(프로덕션 오염 금지).

### 4.2 접근 매트릭스 E2E (P0)
- FR-4: Playwright. 계정별로 1회 로그인 → `storageState` 저장 → 라우트별 접근 후
  **최종 URL**과 **핵심 DOM 마커**를 단언. 매트릭스는 데이터 테이블로 정의하고 셀을 순회 생성.
  ```
  for (role of accounts) for (route of routes)
    expect(finalUrl).toBe(matrix[role][route].expect)   // O or redirect target
  ```
- FR-5: 리다이렉트 체인 무한루프 감지(AC-35).
- FR-6: 모바일 뷰포트(390px) 탭 노출 매트릭스(AC-40/41) 별도 프로젝트.

### 4.3 API 계약·RLS 테스트 (P0)
- FR-7: 화면을 거치지 않고 각 역할의 access_token으로 직접 호출:
  - `/api/ai/tutor` POST → 재학생/admin 200, 그 외 403 (AI-01).
  - Supabase REST를 토큰별로 때려 SEC-01~13 단언 (타인 invoice/profile/membership,
    match_rag_chunks revoke, sessions update 거부 등).
- FR-8: service_role 키가 클라이언트 번들에 없음을 정적 검사(SEC-11).

### 4.4 정적 게이트 린트 (P0)
- FR-9: `app/portal/**/page.tsx`, `app/alumni/**/page.tsx`, `app/admin/**/layout.tsx`가
  대응하는 `require*Access`(또는 admin layout) 호출을 포함하는지 AST/grep 검사. 누락 시 실패.
  → "페이지 추가하며 게이트 깜빡" 사고를 원천 차단(02번 갭 3).
- FR-10: `/api/**/route.ts` 중 보호 대상 라우트가 권한 검사 코드를 포함하는지 검사.

### 4.5 RAG 스모크 (P1)
- FR-11: 재학생 토큰으로 "18기 등록비" 질문 → 응답에 "220만원"과 출처 문자열 포함(AI-02).
- FR-12: `npm run rag:sync`를 임시 파일 추가/삭제로 돌려 증분 동작(추가 파일만 임베딩, 삭제 반영)
  단언(AI-09/10). 별도 test 프로젝트 벡터테이블 사용.

### 4.6 구현 진척 리포트 (P1)
- FR-13: 각 케이스에 `status: pass|xfail(mock)|todo` 태그. xfail은 실패해도 스위트는 green,
  단 리포트에 "목업 12건"으로 집계. 목업이 실동작으로 바뀌면 xfail→pass 전환을 강제(예상외 성공 시 알림).
- FR-14: 결과를 마크다운/HTML 대시보드로 출력(역할×라우트 히트맵, 진척률).

## 5. 기술 설계 (권장)

| 레이어 | 도구 | 근거 |
|---|---|---|
| E2E 브라우저 | **Playwright** (`@playwright/test`) | storageState 다계정, 리다이렉트 추적, CI 친화 |
| API/RLS | Playwright `request` 또는 vitest + supabase-js | 토큰별 직접 호출 |
| 정적 게이트 린트 | Node 스크립트(ts-morph 또는 정규식) | 의존성 최소 |
| 계정 프로비저닝 | Supabase Admin API(service role) | 기존 seed 스크립트 재사용 |
| 격리 | Supabase **branch**(프리뷰) + Vercel preview URL | 프로덕션 비오염 |
| CI | GitHub Actions (PR trigger) | 배포 전 게이트 |

디렉토리(안):
```
apps/ai4ceo/tests/
  fixtures/accounts.ts        # 5계정 + 상태전이 헬퍼
  matrix.access.spec.ts       # FR-4 (핵심)
  api.authz.spec.ts           # FR-7
  rls.security.spec.ts        # SEC-01~13
  rag.smoke.spec.ts           # FR-11
  static/gate-lint.mjs        # FR-9/10
  provision.mjs               # FR-1/2
playwright.config.ts
```

## 6. 마일스톤

- **M1 (0.5일)**: provision 스크립트 정식화 + Playwright 셋업 + 매트릭스 E2E(FR-4) — 최고 ROI.
- **M2 (0.5일)**: API/RLS 테스트(FR-7/8) + 정적 게이트 린트(FR-9/10).
- **M3 (0.5일)**: RAG 스모크 + xfail 리포트(FR-11~14).
- **M4**: GitHub Actions 연결, Supabase 브랜치 격리.

## 7. 리스크·미결정

- **격리 환경**: 현재 프로덕션 Supabase 하나뿐. 테스트가 프로덕션 데이터를 건드리지 않도록
  브랜치/전용 프로젝트 결정 필요(미결정, 권장: Supabase branch).
- **매직링크 E2E**: 메일 수신이 필요한 AUTH-05는 자동화 난이도 높음 → Admin API로 세션을 직접
  발급(generateLink)해 우회하거나 xfail 처리.
- **LLM 비결정성**: RAG 스모크는 정확 문자열 대신 "220만원 포함" 같은 느슨한 단언 + 재시도.
- **Fable 5 비용**: 스모크는 effort low + 최소 질문 1건으로 제한.

## 8. 지표

- 매트릭스 65셀 자동 검증률 100%, P0 보안 케이스 회귀 0건 유지.
- 목업→실구현 전환 추적(xfail 감소 곡선)을 릴리스 리포트에 노출.
