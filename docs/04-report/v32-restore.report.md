# ai4ceo-portal-v3.2-restore 완료 보고서

> **Project**: ai4ceo (ai4ceo-portal) · **Branch**: release/v3.2.1 · **Date**: 2026-09-04
> **Cycle**: PDCA 1회전 (Plan → Design → Do → Check → Act → QA → Report)

---

## Executive Summary

| Perspective | Content |
|---|---|
| **Problem** | Supabase 프로젝트가 삭제되어 DB 테이블 0개, `.env.local`은 존재하지 않는 구 프로젝트를 가리켜 ai4ceo.app이 전면 장애였다. |
| **Solution** | 신규 프로젝트에 저장소 마이그레이션 27건을 순차 재적용하고, 로컬·Vercel 환경변수를 교체한 뒤, PRD 사이트맵에서 누락된 관리자 화면 4개를 구현하고 프로덕션 배포했다. |
| **Function/UX Effect** | PRD v3.2 사이트맵 39개 라우트 100% 가동. 공개 화면은 신규 DB의 18기 커리큘럼을 실제로 렌더하고, 관리자 화면은 로그인 가드로 정상 차단된다. |
| **Core Value** | 장애 상태의 포탈이 PRD v3.2 규격 그대로 되살아났고, 저장소 마이그레이션과 원격 DB 이력이 1:1로 맞아 이후 스키마 변경이 안전해졌다. |

### Value Delivered

| 지표 | 시작 | 완료 |
|---|---|---|
| public 테이블 | 0개 | 40개 (RLS 정책 79개, 미적용 0) |
| 마이그레이션 이력 | 0행 | 27행 (저장소 27파일과 1:1) |
| PRD 사이트맵 커버리지 | 89.7% (35/39) | **100% (39/39)** |
| ai4ceo.app | 전면 장애 | 200 (프로덕션 배포 READY) |
| Gap Match Rate | — | **98.5%** (보수적 하한, 게이트 95% 통과) |

---

## 1. 단계별 결과

| 단계 | 산출물 | 결과 |
|---|---|---|
| Plan | `docs/01-plan/features/v32-restore.plan.md` | FR 6건 · SC 6건 정의 |
| Design | `docs/02-design/features/v32-restore.design.md` | 3안 비교 후 Option C(순차 재적용) 채택 |
| Do-1 | 마이그레이션 27건 적용 | 테이블 40 · 정책 79 · 시드 18기 |
| Do-2 | env 교체 | `.env.local` + Vercel production/preview |
| Do-3 | 빌드 검증 | `tsc --noEmit` 0 error · `next build` 64/64 |
| Check | `docs/03-analysis/v32-restore.analysis.md` | 89.7% → 게이트 미달 판정 |
| Act | 관리자 화면 4개 구현 + 내비 연결 | 100% 도달 |
| QA | L1 18항목 | 18/18 통과 (L2/L3 미측정) |
| Deploy | `vercel --prod` | `dpl_GcHSGTKSRePhZv4SUiQde5o49LSB` READY |

---

## 2. 변경 파일

| 파일 | 변경 이유 |
|---|---|
| `apps/ai4ceo/.env.local` | Supabase URL·anon key를 신규 프로젝트로 교체 |
| `apps/ai4ceo/lib/db/types.ts` | 신규 관리자 화면용 타입 6개 추가 |
| `apps/ai4ceo/lib/db/queries.ts` | 추천 성과·알림 로그·대화방 요약·Drive 권한 조회 6개 추가 |
| `apps/ai4ceo/components/admin-shell.tsx` | 신규 4개 화면 내비게이션 연결 |
| `apps/ai4ceo/app/admin/referrals/page.tsx` | PRD §7.2 신규 |
| `apps/ai4ceo/app/admin/notifications/page.tsx` | PRD §7.2 신규 |
| `apps/ai4ceo/app/admin/chat/page.tsx` | PRD §7.2 신규 |
| `apps/ai4ceo/app/admin/drive-policy/page.tsx` | PRD §7.2 신규 |
| Vercel env (production/preview) | `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

**소스 코드는 삭제 없이 전부 재사용했다.** 신규 의존성 0건.

---

## 3. Key Decisions & Outcomes

| 출처 | 결정 | 결과 |
|---|---|---|
| [Design] | 마이그레이션을 합치지 않고 파일 1건 = 마이그레이션 1건으로 순차 적용 | 저장소 ↔ 원격 이력 1:1 유지, 이후 `supabase db push`/`db diff` 정상 동작 |
| [Plan] | service_role 클라이언트 신설 금지 | 지켜짐 — 다만 기존 `lib/ai/retrieval.ts`가 쓰는 키가 무효화됨(§5) |
| [Act] | 신규 화면은 읽기 전용 운영 콘솔로 한정 | PRD가 M4로 잡은 쓰기 기능(검색·고정·동기화)은 의도적으로 미구현, 분석서에 명시 |
| [Design] | 배포는 저장소 루트에서 | Root Directory 오류 없이 1회 성공 |

---

## 4. Success Criteria 최종 상태

| # | 기준 | 상태 | 근거 |
|---|---|:---:|---|
| SC-1 | 마이그레이션 27건 적용 | ✅ | `schema_migrations` 27행 |
| SC-2 | 테이블 존재 + 전부 RLS | ✅ | 40 테이블 · RLS 미적용 0 · 정책 79 |
| SC-3 | 사이트맵 ≥95% | ✅ | 39/39 = 100% |
| SC-4 | build + typecheck | ✅ | 0 error / 64 페이지 |
| SC-5 | advisor ERROR 0 | ✅ | ERROR 0 (WARN/INFO만) |
| SC-6 | 프로덕션 배포 | ✅ | ai4ceo.app · www.ai4ceo.app 200 |

**6/6 달성**

---

## 5. 남은 작업 (인계)

| 우선 | 항목 | 사유 |
|:---:|---|---|
| 🔴 | 관리자 계정 생성 | 신규 프로젝트 `auth.users` 0명 — 관리자 화면 진입 불가 |
| 🔴 | `SUPABASE_SERVICE_ROLE_KEY` 신규 키로 교체 | 구 프로젝트 키라 AI 조교 RAG 검색·`rag:sync` 불가. 대시보드에서만 발급 가능해 자동화 불가 |
| 🟡 | L2/L3 인증 시나리오 QA | 테스트 계정 부재로 이번 사이클에서 미측정 |
| 🟡 | RAG 재색인 (`npm run rag:sync`) | 인덱스 테이블 비어 있음 |
| 🟢 | PRD §7.2 사이트맵에 v3.1~v3.2 추가 화면 15건 반영 | 문서-구현 역방향 갭 |
| 🟢 | `/admin/chat` 검색·고정, `/admin/drive-policy` 동기화 (M4) | PRD 상 M4 범위 |

---

## 6. 배운 것

- **소스가 멀쩡해도 백엔드가 사라지면 서비스는 죽는다.** 이번 장애의 실제 원인은 코드가 아니라 `.env.local`이 존재하지 않는 프로젝트를 가리킨 것이었다. 진단 첫 단계에서 env의 project ref와 실제 프로젝트 목록을 대조한 것이 전체 시간을 줄였다.
- **마이그레이션 이력을 합치면 편하지만 되돌릴 수 없다.** 27건을 한 덩어리로 적용했다면 이후 `db diff`가 전부 어긋났을 것이다.
- **게이트는 실제로 걸려야 의미가 있다.** 1차 Check에서 89.7%로 멈춘 덕에 PRD에만 있고 구현엔 없던 관리자 화면 4개가 드러났다.
