# 07. RLS · 보안 · API 직접 공격 (SEC)

화면 게이트(02번)와 별개로, **API/DB를 직접 때렸을 때** 방어되는지 검증. 공격자는 화면을 안 거친다.

| ID | 시나리오 | 절차 | 기대결과 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| SEC-01 | 타 수강생 인보이스 조회 | 재학생 A 토큰으로 `rest/v1/invoices?id=eq.<B의 invoice>` | 빈 결과 (RLS: 본인 enrollment 연결만) | **P0** | ✅ |
| SEC-02 | 타인 profiles 조회 | A 토큰으로 다른 유저 profiles select | 본인/admin만 (빈 결과) | P0 | ✅ |
| SEC-03 | 비admin의 applications 조회 | 재학생 토큰으로 applications 전체 select | 빈 결과 (admin만 select, 단 insert는 공개) | P0 | ✅ |
| SEC-04 | 공개 지원서 insert 남용 | anon으로 applications insert 반복 | 허용됨(설계상 공개 폼) — ⚠ rate limit/captcha 없음 → 스팸 취약 | P1 | ⚠ 갭 |
| SEC-05 | 벡터DB 직접 조회 | anon/authenticated로 `rpc/match_rag_chunks` | 권한 오류 (REVOKE execute) | **P0** | ✅ |
| SEC-06 | rag_chunks 직접 select | anon으로 rag_chunks select | 빈 결과 (RLS on, 정책 없음 → service role만) | P0 | ✅ |
| SEC-07 | 세션/자료 무단 조회 | 관심자 토큰으로 sessions select | is_published=true는 보이나(공개 세션 목록 허용), videos/materials는 enrolled만 | P1 | ✅ (정책 확인) |
| SEC-08 | 관리자 전용 쓰기 | 재학생 토큰으로 sessions update | RLS 거부 (sessions_admin = is_admin()) | **P0** | ✅ |
| SEC-09 | curriculum_change_logs 위조 | 비admin이 change_logs insert | 거부 (admin만) | P1 | ✅ |
| SEC-10 | AI 튜터 우회 호출 | 졸업생 토큰으로 `/api/ai/tutor` POST | 403 (라우트 게이트) | **P0** | ✅ |
| SEC-11 | service_role 키 노출 여부 | 클라이언트 번들·네트워크 검사 | NEXT_PUBLIC_ 아닌 SERVICE_ROLE 키가 브라우저에 없음 | **P0** | ✅ (서버 전용 사용) |
| SEC-12 | memberships 위조 | 졸업생이 본인 membership status=active로 update | 거부 (memberships_admin only, self는 select만) | **P0 돈** | ✅ |
| SEC-13 | 만료 멤버십으로 아카이브 접근 | membership expired 상태에서 sessions API | canAccessArchive가 active 행 존재로만 판정 → 거부 | **P0 돈** | ✅ |

## 보안 어드바이저 알려진 경고 (수용됨)
Supabase advisor의 다음 경고는 **의도된 설계**로 수용:
- `applications_insert`/`notif_ins`/`aisrc_ins` WITH CHECK (true): 공개 지원·시스템 삽입 목적.
- `is_admin`/`is_enrolled`/`match_rag_chunks` SECURITY DEFINER: RLS 판정용, match_rag_chunks는 EXECUTE revoke로 보완.

## ⚠ 후속 필요
- SEC-04: 지원 폼 스팸 방어(간단한 rate limit 또는 hCaptcha) — P1.
