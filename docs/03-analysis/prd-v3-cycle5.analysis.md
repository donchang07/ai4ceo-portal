# prd-v3-cycle5 Gap Analysis (PDCA Check)

- **Date**: 2026-07-21 · **Method**: Static only · Formula: Structural×0.2 + Functional×0.4 + Contract×0.4
- **Design**: [prd-v3-cycle5.design.md](../02-design/features/prd-v3-cycle5.design.md)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | E-6(수료생 선택형 공개 프로필)·E-10(동문 디렉토리)이 사이트맵에만 있고 실제 라우트가 없음 — 기존 "디렉토리" 링크가 존재하지 않는 앵커(`/alumni#directory`)였음 |
| **WHO** | 동문(alumni)·admin(편집·디렉토리) · 누구나(공개 프로필 조건부) |
| **RISK** | `profiles` RLS가 타인 조회를 막아 디렉토리·공개 프로필에 타인 정보 노출이 막힐 수 있음 |
| **SUCCESS** | build+tsc 통과, Check ≥90% |
| **SCOPE** | `/alumni/profile`, `/alumni/directory`, `/alumni/[profileSlug]` |

## Overall: 95% ✅ (기준 ≥90)

| Axis | Weight | Score |
|------|:------:|:-----:|
| Structural | 0.2 | 100% |
| Functional | 0.4 | 93% |
| Contract | 0.4 | 95% |
| **Overall** | — | **95%** |

## Axis Detail

- **Structural 100%**: Design §2의 8개 파일(신규 7·수정 1) 전부 실구현. 3개 라우트 모두 next build 노출, tsc 0 에러.
- **Functional 93%**: F1(공개범위 3단·기본정보·소개·연락처 분리 토글·저장) 전부 구현, 미리보기 링크 포함. F2(기수 필터·카드 그리드·빈 상태) 구현. F3(공개 렌더·비공개 티저·연락처 조건부 노출) 구현. 0.07 감점: 사진 업로드가 URL 입력조차 없이 스키마상 `photo_path` 컬럼만 있고 편집 폼에 필드가 빠짐(Design §3에 "업로드 인프라 없음 — 범위 밖"으로 명시했으나 URL 입력조차 제공 안 한 것은 사소한 과소 구현).
- **Contract 95%**: `alumni_profiles` upsert 필드가 RLS·마이그레이션 컬럼과 완전히 일치. `is_alumni()` 함수가 `has_active_membership()`와 동일 패턴(anon 차단 포함). 디렉토리·공개 프로필이 `profiles` 조인 없이 `alumni_profiles` 비정규화 컬럼만 사용 — Plan D-2 설계와 일치. 0.05 감점: `/alumni/profile`의 기본값 프리필이 `profiles.title`/`company`에서 오는데, 사용자가 그 이후 `profiles`를 수정해도 `alumni_profiles`는 자동 동기화되지 않음(의도된 비정규화 트레이드오프이나 문서화 필요).

## Check 중 확인한 결함

없음(Critical/Important 0건).

| # | Minor | 내용 · 처리 |
|---|---|---|
| M1 | 프로필 사진 URL 입력 필드 누락 | `photo_path` 컬럼은 있으나 편집 폼에 노출 안 함 — 실제 업로드 인프라(Storage) 붙일 때 함께 추가하는 게 자연스러워 백로그 유지 |
| M2 | `alumni_profiles`의 비정규화 필드(이름/직함/회사)가 `profiles` 갱신과 자동 동기화 안 됨 | 의도된 트레이드오프(RLS 우회 없이 타인 열람 지원) — 사용자가 프로필 편집 화면에서 직접 갱신하는 것이 유일한 경로임을 UI 문구로 안내할지는 향후 검토 |

## 판정

SC-1~5 충족. Critical/Important 0건 — **iterate 불필요, Act 진행**.
