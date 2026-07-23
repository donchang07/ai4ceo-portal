# 08. Security and non-functional requirements

## Security and RLS

| ID | PRD | Pri | Layer | Preconditions | Test data | Steps | Assertions | Forbidden | Cleanup | Gate |
|---|---|---:|---|---|---|---|---|---|---|---|
| SEC-001 | NFR-security | P0 | static/db | migrated staging DB | all public tables | pg metadata/RLS 조회 | 모든 업무 테이블 relrowsecurity=true; 정책 없는 테이블은 service-only로 명시 | RLS off 업무 테이블 | 없음 | must_pass |
| SEC-002 | B-2 | P0 | api | anon | application.* | applications insert/select/update/delete | insert만 허용; select/update/delete 403/빈 결과 | 다른 지원서 조회 | 생성 row service cleanup | must_pass |
| SEC-003 | H-3 | P0 | api | student | applications select | REST 호출 | 빈 배열/403 | PII 반환 | 없음 | must_pass |
| SEC-004 | profiles | P0 | api | student A/B | B user id | A token으로 B profile select/update | 빈 결과/403; B unchanged | email/company 노출 | 없음 | must_pass |
| SEC-005 | D-2 | P0 | api | student | session update payload | REST update | 403/RLS error; session unchanged | updated_at 변경 | 없음 | must_pass |
| SEC-006 | D-10 | P0 | api | other-cohort student | demoSession id | questions/answers select/insert | 빈 결과/403; insert 0 | cohort 간 Q&A 노출 | 없음 | must_pass |
| SEC-007 | D-5 | P0 | api | applicant | videos/materials select | REST 호출 | 빈 결과/403; file_path/video URL 미포함 | 직접 URL 반환 | 없음 | must_pass |
| SEC-008 | D-19 | P0 | api | alumni/applicant/guest | question.body | AI route POST | 403; ai log 0행 | LLM 호출 발생 | 없음 | must_pass |
| SEC-009 | E-11 | P0 | api | alumni | membership active update | REST update | 403/RLS error; original unchanged | self activation | 없음 | must_pass |
| SEC-010 | US-07 | P0 | api | unlinked assistant | delegated task seed | select/update | 빈 결과/403 | email만 같아서 접근 | seed 삭제 | must_pass |
| SEC-011 | US-09 | P0 | api | student B | student A roadmap | select/update | 빈 결과/403 | roadmap text 노출 | seed 삭제 | must_pass |
| SEC-012 | secret | P0 | static/e2e | production build | key name patterns | JS bundle/source map/network 검사 | service role/SMTP/Toss/Popbill secret pattern 0건 | secret value 노출 | 없음 | must_pass |
| SEC-013 | B-2,NFR | P1 | api | anon | 21 inserts/minute same fingerprint | 반복 요청 | 정의한 rate limit 이후 429/captcha; 정상 1건 허용 | 무제한 insert | 생성 rows 삭제 | known_gap |
| SEC-014 | privacy | P0 | e2e/static | guest | public profile/build seeds with opt-in false | 공개 경로/검색/HTML 검사 | 비공개 name/company/build 0건 | HTML/RSC/metadata에 PII | seed 삭제 | must_pass |

## Non-functional

| ID | PRD | Pri | Layer | Preconditions | Test data | Steps | Assertions | Forbidden | Cleanup | Gate |
|---|---|---:|---|---|---|---|---|---|---|---|
| NFR-001 | performance | P0 | e2e | production-like build, cold cache | `/`, `/program`, `/apply` | Chromium performance 측정 3회 median | mobile LCP <2500ms; failed resource 0; CLS <0.1 | 단일 warm run만 측정 | 없음 | must_pass |
| NFR-002 | performance | P1 | e2e | student storage state | portal routes | client navigation 5회 | route transition median <1000ms; p95 <2000ms | auth setup 시간 포함 | 없음 | must_pass |
| NFR-003 | accessibility | P0 | static/e2e | axe rules WCAG 2.1 AA | 주요 15 routes | axe scan + keyboard journey | serious/critical violation 0; focus visible; dialog focus trap; form labels | color-only status | 없음 | must_pass |
| NFR-004 | responsive | P0 | e2e | guest/student/admin | 390x844, 768x1024, 1440x900 | 주요 route screenshot/layout 검사 | horizontal overflow 0; 주요 CTA viewport 내; touch target ≥44px | 숨은 action으로만 수행 가능 | 없음 | must_pass |
| NFR-005 | browser | P1 | e2e | Playwright projects | Chromium, WebKit | P0 journey 실행 | 동일 assertion 통과; WebKit console error 0 | Chrome-only API 무폴백 | 없음 | must_pass |
| NFR-006 | PWA | P1 | e2e/static | production build | manifest/service worker | manifest fetch, installability, offline reload | manifest 200/name/icons/start_url; SW active; offline shell에서 공지/일정 last cache 표시 | 민감 API response cache | cache/context 삭제 | known_gap |
| NFR-007 | privacy | P0 | static/e2e | guest | privacy policy route | 지원 폼에서 동의/정책 확인 | 개인정보처리방침 링크; 필수 동의 기록; 보존기간 6개월 명시 | 동의 없이 submit | 생성 application 삭제 | known_gap |
| NFR-008 | i18n | P2 | static | source tree | user-visible string scan | 정적 분석 | 허용 목록 외 JSX 하드코딩 0건 또는 번역 키 사용 | DB 콘텐츠까지 오탐 | 없음 | known_gap |
| NFR-009 | design | P1 | visual | approved baselines | desktop/mobile routes | screenshot comparison | diff ≤0.5% 또는 승인; Pretendard/Lucide/token 사용 | 깨진 폰트/아이콘 혼용 | artifacts만 삭제 | manual_only |
| NFR-010 | availability | P1 | contract/manual | backup-enabled staging | PITR drill record | 백업 설정 확인+복원 리허설 | RPO≤24h; test schema/table 복원 성공; 증거 기록 | 운영 DB에 restore drill | test restore project 삭제 | manual_only |

