# 테스트 리포트 — 2026-07-22T18:44:04.273Z

대상 커밋: 786df73 · 환경: staging · baseUrl: https://ai4ceo-portal-9ah9bq3hb-don-changs-projects.vercel.app

## 요약
| 구분 | 수 |
|---|---:|
| 전체 케이스(문서) | 163 |
| 자동화 실행 | 160 |
| ✅ 정상 통과 | 94 |
| 🔴 회귀(문서 ✅ ↔ 실패) | 30 |
| 🟢 신규 통과(문서 ⚠ ↔ 통과) | 0 |
| ⚪ 예상 미구현(xfail) | 36 |
| 🟡 미검증→검증됨 | 0 |
| ⚪ 미자동화/미실행(manual) | 3 |

## 정적 게이트 린트
- ✅ FR-11 portal/alumni 게이트 — 15개 페이지 검사
- ✅ FR-11 admin layout 게이트 상속 — admin 페이지 6개 · layout 게이트 확인
- ✅ FR-12 api route 권한 검사 — 1개 route 검사
- ✅ SEC-11 service_role 키 클라이언트 미노출 — 클라이언트 번들 노출 없음

## 🔴 회귀 (배포 차단) — 30건
- PUB-002 (01, P0) — Error: expect(locator).toBeVisible() failed
- PUB-003 (01, P0) — Error: 지원 자격 FAQ가 보여야 한다
- APP-010 (01, P0) — Error: expect(locator).toBeVisible() failed
- AUTH-004 (02, P0) — Error: expect(locator).toBeVisible() failed
- AUTH-005 (02, P0) — Error: page.goto: net::ERR_CONNECTION_REFUSED at https://hfuzeddcthgelloufkji.supabase.co/auth/v1/verify?token=[REDACTED]&type=magiclink&redirect_to=http://localhost:3000
- AUTH-006 (02, P0) — Error: page.goto: net::ERR_CONNECTION_REFUSED at https://hfuzeddcthgelloufkji.supabase.co/auth/v1/verify?token=[REDACTED]&type=magiclink&redirect_to=http://localhost:3000
- AUTH-007 (02, P1) — Error: page.goto: net::ERR_CONNECTION_REFUSED at https://hfuzeddcthgelloufkji.supabase.co/auth/v1/verify?token=[REDACTED]&type=magiclink&redirect_to=http://localhost:3000
- AUTH-008 (02, P1) — Error: page.goto: net::ERR_CONNECTION_REFUSED at https://hfuzeddcthgelloufkji.supabase.co/auth/v1/verify?token=[REDACTED]&type=magiclink&redirect_to=http://localhost:3000
- AUTH-009 (02, P0) — Error: page.goto: net::ERR_CONNECTION_REFUSED at https://hfuzeddcthgelloufkji.supabase.co/auth/v1/verify?token=[REDACTED]&type=magiclink&redirect_to=http://localhost:3000
- AUTH-010 (02, P0) — Error: page.goto: net::ERR_CONNECTION_REFUSED at https://hfuzeddcthgelloufkji.supabase.co/auth/v1/verify?token=[REDACTED]&type=magiclink&redirect_to=http://localhost:3000
- AUTH-011 (02, P1) — Error: page.goto: net::ERR_CONNECTION_REFUSED at https://hfuzeddcthgelloufkji.supabase.co/auth/v1/verify?token=[REDACTED]&type=magiclink&redirect_to=http://localhost:3000
- ACC-007 (02, P0) — Error: assistant_links 계약과 RLS가 존재해야 한다
- BILL-005 (03, P0) — Error: expect(received).toBe(expected) // Object.is equality
- BILL-006 (03, P0) — Error: expect(received).toBeNull()
- BILL-012 (03, P0) — Error: expect(received).toHaveLength(expected)
- LMS-009 (04, P0) — Error: expect(received).toEqual(expected) // deep equality
- LMS-018 (04, P0) — Error: expect(locator).toBeVisible() failed
- AI-001 (05, P0) — Error: expect(received).not.toBe(expected) // Object.is equality
- AI-003 (05, P0) — Error: expect(received).toBe(expected) // Object.is equality
- AI-006 (05, P1) — Error: expect(received).toBeGreaterThanOrEqual(expected)
- AI-008 (05, P1) — Error: expect(received).not.toMatch(expected)
- ARCH-004 (06, P0) — Error: expect(received).toEqual(expected) // deep equality
- ADM-001 (07, P0) — Error: expect(locator).toHaveCount(expected) failed
- ADM-003 (07, P0) — Test timeout of 60000ms exceeded.
- ADM-010 (07, P0) — Error: expect(received).toBe(expected) // Object.is equality
- SEC-010 (08, P0) — Error: expect(received).toEqual(expected) // deep equality
- NFR-001 (08, P0) — Error: expect(received).toEqual(expected) // deep equality
- NFR-002 (08, P1) — Error: expect(received).toBeLessThan(expected)
- NFR-004 (08, P0) — Error: expect(received).toBeGreaterThanOrEqual(expected)
- NFR-005 (08, P1) — Error: browserType.launch: Executable doesn't exist at C:\Users\donch\AppData\Local\ms-playwright\webkit-2311\Playwright.exe

## 케이스별 결과
| ID | 파일 | 우선순위 | 선언 | 실제 | 판정 |
|---|---|---|---|---|---|
| PUB-001 | 01 | P0 | ✅ | pass | ✅ |
| PUB-002 | 01 | P0 | ✅ | fail | 🔴 |
| PUB-003 | 01 | P0 | ✅ | fail | 🔴 |
| PUB-004 | 01 | P0 | ⚠ | fail | ⚪ |
| PUB-005 | 01 | P1 | ⚠ | fail | ⚪ |
| PUB-006 | 01 | P1 | ⚠ | fail | ⚪ |
| APP-001 | 01 | P0 | ✅ | pass | ✅ |
| APP-002 | 01 | P0 | ✅ | pass | ✅ |
| APP-003 | 01 | P0 | ⚠ | fail | ⚪ |
| APP-004 | 01 | P0 | ✅ | pass | ✅ |
| APP-005 | 01 | P0 | ✅ | pass | ✅ |
| APP-006 | 01 | P0 | ⚠ | fail | ⚪ |
| APP-007 | 01 | P0 | ✅ | pass | ✅ |
| APP-008 | 01 | P0 | ⚠ | fail | ⚪ |
| APP-009 | 01 | P0 | ✅ | pass | ✅ |
| APP-010 | 01 | P0 | ✅ | fail | 🔴 |
| APP-011 | 01 | P0 | ✅ | pass | ✅ |
| APP-012 | 01 | P0 | ✅ | pass | ✅ |
| APP-013 | 01 | P0 | ✅ | pass | ✅ |
| APP-014 | 01 | P0 | ✅ | pass | ✅ |
| AUTH-001 | 02 | P0 | ✅ | pass | ✅ |
| AUTH-002 | 02 | P0 | ✅ | pass | ✅ |
| AUTH-003 | 02 | P1 | ✅ | pass | ✅ |
| AUTH-004 | 02 | P0 | ✅ | fail | 🔴 |
| AUTH-005 | 02 | P0 | ✅ | fail | 🔴 |
| AUTH-006 | 02 | P0 | ✅ | fail | 🔴 |
| AUTH-007 | 02 | P1 | ✅ | fail | 🔴 |
| AUTH-008 | 02 | P1 | ✅ | fail | 🔴 |
| AUTH-009 | 02 | P0 | ✅ | fail | 🔴 |
| AUTH-010 | 02 | P0 | ✅ | fail | 🔴 |
| AUTH-011 | 02 | P1 | ✅ | fail | 🔴 |
| AUTH-012 | 02 | P2 | ✅ | pass | ✅ |
| AUTH-013 | 02 | P1 | ⚠ | fail | ⚪ |
| AUTH-014 | 02 | P0 | ⚠ | fail | ⚪ |
| ACC-001 | 02 | P0 | ✅ | pass | ✅ |
| ACC-002 | 02 | P0 | ✅ | pass | ✅ |
| ACC-003 | 02 | P0 | ✅ | pass | ✅ |
| ACC-004 | 02 | P0 | ✅ | pass | ✅ |
| ACC-005 | 02 | P0 | ✅ | pass | ✅ |
| ACC-006 | 02 | P0 | ✅ | pass | ✅ |
| ACC-007 | 02 | P0 | ✅ | fail | 🔴 |
| ACC-008 | 02 | P0 | ✅ | pass | ✅ |
| ACC-009 | 02 | P0 | ✅ | pass | ✅ |
| ACC-010 | 02 | P0 | ✅ | pass | ✅ |
| ACC-011 | 02 | P0 | ✅ | pass | ✅ |
| ACC-012 | 02 | P0 | ✅ | pass | ✅ |
| ACC-013 | 02 | P1 | ✅ | pass | ✅ |
| ACC-014 | 02 | P1 | ⚠ | fail | ⚪ |
| ENR-001 | 03 | P0 | ⚠ | fail | ⚪ |
| ENR-002 | 03 | P0 | ⚠ | fail | ⚪ |
| ENR-003 | 03 | P0 | ⚠ | fail | ⚪ |
| ENR-004 | 03 | P0 | ⚠ | fail | ⚪ |
| BILL-001 | 03 | P0 | ✅ | pass | ✅ |
| BILL-002 | 03 | P0 | ✅ | pass | ✅ |
| BILL-003 | 03 | P0 | ⚠ | fail | ⚪ |
| BILL-004 | 03 | P0 | ⚠ | fail | ⚪ |
| BILL-005 | 03 | P0 | ✅ | fail | 🔴 |
| BILL-006 | 03 | P0 | ✅ | fail | 🔴 |
| BILL-007 | 03 | P1 | ⚠ | fail | ⚪ |
| BILL-008 | 03 | P0 | ⚠ | fail | ⚪ |
| BILL-009 | 03 | P1 | ⚠ | fail | ⚪ |
| BILL-010 | 03 | P1 | ⚠ | fail | ⚪ |
| BILL-011 | 03 | P1 | ✅ | pass | ✅ |
| BILL-012 | 03 | P0 | ✅ | fail | 🔴 |
| BILL-013 | 03 | P0 | ✅ | pass | ✅ |
| MEM-001 | 03 | P0 | ✅ | pass | ✅ |
| MEM-002 | 03 | P0 | ✅ | pass | ✅ |
| MEM-003 | 03 | P0 | ✅ | pass | ✅ |
| LMS-001 | 04 | P0 | ✅ | pass | ✅ |
| LMS-002 | 04 | P0 | ✅ | pass | ✅ |
| LMS-003 | 04 | P0 | ✅ | pass | ✅ |
| LMS-004 | 04 | P1 | ✅ | pass | ✅ |
| LMS-005 | 04 | P1 | ✅ | pass | ✅ |
| LMS-006 | 04 | P1 | ✅ | pass | ✅ |
| LMS-007 | 04 | P0 | ✅ | pass | ✅ |
| LMS-008 | 04 | P0 | ✅ | pass | ✅ |
| LMS-009 | 04 | P0 | ✅ | fail | 🔴 |
| LMS-010 | 04 | P0 | ⚠ | fail | ⚪ |
| LMS-011 | 04 | P0 | ⚠ | fail | ⚪ |
| LMS-012 | 04 | P0 | ⚠ | fail | ⚪ |
| LMS-013 | 04 | P0 | ⚠ | fail | ⚪ |
| LMS-014 | 04 | P0 | ⚠ | fail | ⚪ |
| LMS-015 | 04 | P0 | ✅ | pass | ✅ |
| LMS-016 | 04 | P0 | ✅ | pass | ✅ |
| LMS-017 | 04 | P0 | ✅ | pass | ✅ |
| LMS-018 | 04 | P0 | ✅ | fail | 🔴 |
| LMS-019 | 04 | P1 | ✅ | pass | ✅ |
| LMS-020 | 04 | P1 | ✅ | pass | ✅ |
| LMS-021 | 04 | P0 | ✅ | pass | ✅ |
| LMS-022 | 04 | P0 | ✅ | pass | ✅ |
| LMS-023 | 04 | P0 | ✅ | pass | ✅ |
| LMS-024 | 04 | P0 | ⚠ | fail | ⚪ |
| AI-001 | 05 | P0 | ✅ | fail | 🔴 |
| AI-002 | 05 | P0 | ✅ | skip | ⚪ |
| AI-003 | 05 | P0 | ✅ | fail | 🔴 |
| AI-004 | 05 | P0 | ✅ | pass | ✅ |
| AI-005 | 05 | P1 | ✅ | pass | ✅ |
| AI-006 | 05 | P1 | ✅ | fail | 🔴 |
| AI-007 | 05 | P1 | ✅ | pass | ✅ |
| AI-008 | 05 | P1 | ✅ | fail | 🔴 |
| AI-009 | 05 | P2 | ✅ | pass | ✅ |
| AI-010 | 05 | P1 | ⚠ | fail | ⚪ |
| AI-011 | 05 | P1 | ⚠ | fail | ⚪ |
| AI-012 | 05 | P0 | ✅ | pass | ✅ |
| AI-013 | 05 | P0 | ✅ | pass | ✅ |
| AI-014 | 05 | P0 | ✅ | pass | ✅ |
| TASK-001 | 06 | P1 | ✅ | pass | ✅ |
| TASK-002 | 06 | P1 | ✅ | pass | ✅ |
| TASK-003 | 06 | P0 | ✅ | pass | ✅ |
| TASK-004 | 06 | P1 | ✅ | pass | ✅ |
| BUILD-001 | 06 | P0 | ✅ | pass | ✅ |
| BUILD-002 | 06 | P1 | ✅ | pass | ✅ |
| BUILD-003 | 06 | P1 | ✅ | pass | ✅ |
| BUILD-004 | 06 | P1 | ✅ | pass | ✅ |
| BUILD-005 | 06 | P0 | ✅ | pass | ✅ |
| ROAD-001 | 06 | P1 | ✅ | pass | ✅ |
| ROAD-002 | 06 | P1 | ✅ | pass | ✅ |
| ROAD-003 | 06 | P1 | ✅ | pass | ✅ |
| ROAD-004 | 06 | P0 | ✅ | pass | ✅ |
| ARCH-001 | 06 | P2 | ✅ | pass | ✅ |
| ARCH-002 | 06 | P0 | ✅ | pass | ✅ |
| ARCH-003 | 06 | P1 | ✅ | pass | ✅ |
| ARCH-004 | 06 | P0 | ✅ | fail | 🔴 |
| ADM-001 | 07 | P0 | ✅ | fail | 🔴 |
| ADM-002 | 07 | P0 | ✅ | pass | ✅ |
| ADM-003 | 07 | P0 | ✅ | fail | 🔴 |
| ADM-004 | 07 | P0 | ⚠ | fail | ⚪ |
| ADM-005 | 07 | P0 | ✅ | pass | ✅ |
| ADM-006 | 07 | P0 | ✅ | pass | ✅ |
| ADM-007 | 07 | P0 | ✅ | pass | ✅ |
| ADM-008 | 07 | P1 | ✅ | pass | ✅ |
| ADM-009 | 07 | P0 | ✅ | pass | ✅ |
| ADM-010 | 07 | P0 | ✅ | fail | 🔴 |
| ADM-011 | 07 | P0 | ✅ | pass | ✅ |
| ADM-012 | 07 | P0 | ✅ | pass | ✅ |
| ADM-013 | 07 | P0 | ⚠ | fail | ⚪ |
| ADM-014 | 07 | P0 | ⚠ | fail | ⚪ |
| ADM-015 | 07 | P0 | ⚠ | fail | ⚪ |
| ADM-016 | 07 | P0 | ⚠ | fail | ⚪ |
| SEC-001 | 08 | P0 | ✅ | pass | ✅ |
| SEC-002 | 08 | P0 | ✅ | pass | ✅ |
| SEC-003 | 08 | P0 | ✅ | pass | ✅ |
| SEC-004 | 08 | P0 | ✅ | pass | ✅ |
| SEC-005 | 08 | P0 | ✅ | pass | ✅ |
| SEC-006 | 08 | P0 | ✅ | pass | ✅ |
| SEC-007 | 08 | P0 | ✅ | pass | ✅ |
| SEC-008 | 08 | P0 | ✅ | pass | ✅ |
| SEC-009 | 08 | P0 | ✅ | pass | ✅ |
| SEC-010 | 08 | P0 | ✅ | fail | 🔴 |
| SEC-011 | 08 | P0 | ✅ | pass | ✅ |
| SEC-012 | 08 | P0 | ✅ | pass | ✅ |
| SEC-013 | 08 | P1 | ⚠ | fail | ⚪ |
| SEC-014 | 08 | P0 | ✅ | pass | ✅ |
| NFR-001 | 08 | P0 | ✅ | fail | 🔴 |
| NFR-002 | 08 | P1 | ✅ | fail | 🔴 |
| NFR-003 | 08 | P0 | ✅ | pass | ✅ |
| NFR-004 | 08 | P0 | ✅ | fail | 🔴 |
| NFR-005 | 08 | P1 | ✅ | fail | 🔴 |
| NFR-006 | 08 | P1 | ⚠ | fail | ⚪ |
| NFR-007 | 08 | P0 | ⚠ | fail | ⚪ |
| NFR-008 | 08 | P2 | ⚠ | fail | ⚪ |
| NFR-009 | 08 | P1 | ❓ | manual | ⚪ |
| NFR-010 | 08 | P1 | ❓ | manual | ⚪ |
