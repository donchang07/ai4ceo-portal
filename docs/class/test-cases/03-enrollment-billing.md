# 03. Enrollment, billing, tax and membership

| ID | PRD | Pri | Layer | Preconditions | Test data | Steps | Assertions | Forbidden | Cleanup | Gate |
|---|---|---:|---|---|---|---|---|---|---|---|
| ENR-001 | C-2 | P0 | e2e/db | accepted applicant | profile fixture + pledge=true | 초대 로그인→프로필 완성→서약 동의 | profile 필드 저장; enrollment.status=`enrolled`; student 역할 부여 | 서약 없이 student 부여 | user/profile/enrollment 삭제 | known_gap |
| ENR-002 | C-3,G-1 | P0 | contract/db | ENR-001 완료 | T-04 | 등록 확정 | OT 알림 outbox 1건; 일정·장소·수신자 포함 | 중복 발송 | outbox 삭제 | known_gap |
| ENR-003 | C-4 | P0 | e2e/db | student, unlinked assistant | assistant fixture email | assistant 초대→링크 수락 | assistant_links 1행; student/cohort 정확히 연결; assistant role | 다른 CEO 연결 | link와 assistant test user 삭제 | known_gap |
| ENR-004 | C-4 | P0 | api/db | ENR-003 | assistant link id | assistant가 해제 요청, CEO가 해제 요청 | assistant 요청 403/RLS 거부; CEO 요청 성공; link 삭제 | assistant self-unlink 정책이 명세와 다름 | link 원복/삭제 | known_gap |
| BILL-001 | C-5 | P0 | e2e/db | student invoice seed | amount=2200000, invoiceNo=`INV-QA-${RUN_ID}` | `/portal/billing` | 금액 `2,200,000원`; invoice 번호; DB status와 동일한 타임라인 | 하드코딩 다른 번호/status | seed invoice 삭제 | must_pass |
| BILL-002 | C-5 | P0 | e2e | BILL-001 | bank account `140-012-546787` | `계좌 복사` 클릭 | clipboard 정확히 일치; `복사됨` visible | 공백/하이픈 누락 | 없음 | must_pass |
| BILL-003 | C-9 | P0 | e2e | student | smartstore URL | 스마트스토어 이동 클릭 | 새 탭 URL `https://smartstore.naver.com/aibblab` | href 없음, same-page 깨짐 | 새 탭 닫기 | known_gap |
| BILL-004 | C-7 | P0 | e2e/db | unpaid bank-transfer invoice | company=`Codex QA ${RUN_ID}`, businessNo=`123-45-67890`, file fixture | 세금계산서 요청 폼 제출 | tax_invoices 1행; invoice/user/company/businessNo/status=`requested`; 관리자 큐 visible | 파일 공개 URL, 중복 행 | tax invoice/file 삭제 | known_gap |
| BILL-005 | C-6 | P0 | e2e/db/contract | admin, unpaid invoice snapshot | invoice id | 관리자 `입금확인` | invoices.status=`paid`; enrollments.status=`paid`; paid_at non-null; T-11 outbox 1건; 새로고침 후 유지 | local state만 변경 | snapshot 원복, outbox 삭제 | must_pass |
| BILL-006 | C-6 | P0 | api/db | BILL-005 완료 상태 | same invoice id | 입금확인 두 번째 호출 | HTTP 200/409 중 정책값; paid 전환 1회; 알림 1건 유지 | 중복 이메일/알림, paid_at 재기록 | snapshot 원복 | must_pass |
| BILL-007 | C-8 | P1 | contract/api | Toss staging flag on | amount=2200000, order=`QA-${RUN_ID}` | 결제 생성→승인 webhook | payments 1행; signature 검증; invoice/enrollment paid; T-11 1건 | 서명 없는 webhook 승인 | test payment/invoice 삭제 | known_gap |
| BILL-008 | C-8 | P0 | api | Toss webhook route | unsigned/modified payload | webhook POST | 401 또는 403; DB 변경 0건 | 2xx, paid 변경 | 없음 | known_gap |
| BILL-009 | C-10 | P1 | contract/db | bank_transfer paid + business doc | mock provider | paid 처리 | Popbill mock request 1건; tax invoice status queued/simulated; 법인 필드 일치 | Toss 건 발행 | test rows 삭제 | known_gap |
| BILL-010 | C-10 | P1 | contract/db | Toss paid payment | same business data | 증빙 처리 실행 | Popbill 호출 0건; Toss receipt reference 존재 | 세금계산서 중복 발행 | test rows 삭제 | known_gap |
| BILL-011 | US-04,C-4 | P1 | e2e/db | student + linked assistant | assistant email | billing 위임 저장 | enrollments.billing_delegate_email 정확히 저장; 위임 상태 배지; 새로고침 후 유지 | 미연결 이메일 허용 | 원본 delegate 복원 | must_pass |
| BILL-012 | US-04 | P0 | api/e2e | BILL-011 | assistant session | assistant가 invoice 조회·tax request, payment status 변경 시도 | 조회/요청 허용; paid 변경 403/RLS 거부 | 타 CEO invoice 조회 | tax request 삭제, delegate 원복 | must_pass |
| BILL-013 | C-5,SEC | P0 | api/db | student A/B invoice seed | A token, B invoice id | REST select | `[]`; response 200; PII 0건 | B amount/company 노출 | seed 삭제 | must_pass |
| MEM-001 | E-11 | P0 | e2e/db | alumni_member | end_date=2027-12-31, clock 고정 | `/alumni/membership` | `이용 중`; D-day가 고정 clock 기준 계산값과 일치; 연 `550,000원` VAT 포함 | 하드코딩 D-day | clock 해제 | must_pass |
| MEM-002 | E-11 | P0 | e2e | alumni_expired | — | membership/archive 접근 | `멤버십 갱신`; 재생·다운로드 disabled/미노출 | archive action enabled | 없음 | must_pass |
| MEM-003 | E-11 | P0 | api/db | alumni user | status update payload active | self update memberships | 403 또는 RLS error; status unchanged | self activation | 없음 | must_pass |

