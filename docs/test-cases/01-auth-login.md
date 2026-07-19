# 01. 인증 · 로그인 (AUTH)

정책: **매직링크는 최초 1회만** — 이후 비밀번호 로그인. 첫 매직링크 로그인 시 `/set-password`로
강제 이동해 비밀번호를 설정하고 `profiles.has_password=true`로 기록한다.

| ID | 시나리오 | 절차 | 기대결과 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| AUTH-01 | 비밀번호 로그인 성공 | `/login`에서 테스트 계정 이메일+`uscdon00` 입력 | `/portal/cohort`로 이동, 세션 생성 | P0 | ✅ |
| AUTH-02 | 비밀번호 오류 | 올바른 이메일 + 틀린 비밀번호 | "Invalid login credentials" 류 에러 표시, 이동 없음 | P0 | ✅ |
| AUTH-03 | 미가입 이메일 비밀번호 로그인 | 존재하지 않는 이메일로 로그인 | 에러 표시 (존재 여부가 드러나지 않는 문구면 더 좋음) | P1 | ✅ |
| AUTH-04 | 매직링크 발송 | "매직링크로 로그인" 토글 → 이메일 입력 → 발송 | "링크를 보냈습니다" 안내, 실제 메일 수신 (Gmail SMTP) | P0 | ✅ |
| AUTH-05 | 최초 매직링크 → 비밀번호 설정 강제 | 신규 가입자가 메일 링크 클릭 | `/auth/callback` → `has_password=false`이므로 `/set-password`로 리다이렉트 | P0 | ✅ |
| AUTH-06 | 비밀번호 설정 완료 | `/set-password`에서 8자 이상 비밀번호 2회 입력 | `auth.updateUser` 성공, `has_password=true`, 원래 목적지로 이동 | P0 | ✅ |
| AUTH-07 | 비밀번호 8자 미만 | `/set-password`에서 7자 입력 | "8자 이상" 클라이언트 에러, 서버 호출 없음 | P1 | ✅ |
| AUTH-08 | 비밀번호 불일치 | 확인란에 다른 값 입력 | "일치하지 않습니다" 에러 | P1 | ✅ |
| AUTH-09 | 기설정자 매직링크 재사용 | `has_password=true`인 계정이 매직링크로 로그인 | `/set-password` 건너뛰고 바로 목적지 이동 (비밀번호 분실 복구 경로) | P0 | ✅ |
| AUTH-10 | 첫 로그인 시 profiles 자동 생성 | 신규 auth 유저가 매직링크 로그인 | `profiles` 행 자동 upsert (ignoreDuplicates — 기존 role 유지) | P0 | ✅ |
| AUTH-11 | admin 계정 role 비강등 | admin이 재로그인 | profiles upsert가 role을 applicant로 덮어쓰지 않음 | P0 | ✅ |
| AUTH-12 | 만료/재사용 매직링크 | 이미 사용한 링크 재클릭 | `/login?error=auth`로 이동, 세션 미생성 | P1 | ✅ |
| AUTH-13 | 이메일 rate limit | 같은 주소로 60초 내 매직링크 2회 요청 | Supabase "minimum interval" 에러가 사용자에게 읽을 수 있는 문구로 표시 | P2 | ✅ |
| AUTH-14 | 로그아웃 | 로그아웃 후 `/portal/cohort` 접근 | `/login` 리다이렉트 | P1 | ⚠ **UI에 로그아웃 버튼 없음** — 쿠키 삭제로만 검증 가능. 갭. |

## ⚠ 알려진 갭

- **AUTH-14**: 포탈 상단바 아바타에 로그아웃 메뉴가 없다. (portal-shell.tsx의 "나" 아바타는 장식)
- 비밀번호 재설정(분실) 전용 화면 없음 — 현재는 매직링크 로그인이 사실상의 복구 경로 (AUTH-09).
- `/set-password`를 건너뛰고 URL로 `/portal/*` 직접 진입하면 비밀번호 미설정 상태로 계속 사용 가능
  (has_password는 콜백에서만 검사). 강제하려면 미들웨어 수준 검사 필요 — P2.
