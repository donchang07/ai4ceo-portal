# Handoff: AI4CEO Portal — 화면 설계 (PRD v2.6)

## Overview
AI4CEO Portal(CEO·임원 대상 바이브코딩 스쿨의 모집→결제→교육→수료→AS·멤버십 End-to-End 포탈)의 화면 설계입니다. PRD v2.6을 기준으로 수강생 라이프사이클 상태 머신의 각 단계별 대표 화면 15개(데스크톱 8 + 모바일 7)를 다룹니다. 반응형 웹 + PWA(모바일 웹앱) 동시 지원이 요구사항이므로, 데스크톱과 모바일 화면을 모두 설계했습니다.

## About the Design Files
이 번들의 파일은 **HTML로 제작된 디자인 레퍼런스**입니다 — 의도한 외관과 동작을 보여주는 목업이며, 그대로 복사해 쓸 프로덕션 코드가 아닙니다. 과제는 이 HTML 디자인을 **대상 코드베이스의 기존 환경에서 재구현**하는 것입니다. PRD 기준 타겟 스택: **Next.js 15 (App Router) + Tailwind CSS + shadcn/ui + Supabase**, 모노레포(Turborepo + pnpm). 환경이 아직 없다면 이 스택으로 시작하는 것을 권장합니다.

## Fidelity
**High-fidelity (hifi)** — 최종 컬러·타이포·간격·컴포넌트 상태까지 확정된 픽셀 수준 목업입니다. 코드베이스의 기존 라이브러리(shadcn/ui 등)로 픽셀에 가깝게 재현하되, 아이콘은 목업의 인라인 SVG 대신 **Lucide 라이브러리**(PRD 표준)를 사용하세요.

## Design Tokens (PRD 6.10 준수)
### 컬러
| Role | Token | Hex |
|---|---|---|
| Background(캔버스) | --color-canvas | #F2F6FB |
| Surface | --color-surface | #FFFFFF |
| Surface Muted | --color-surface-muted | #E8F0F8 |
| Text Primary | --color-ink | #1B2733 |
| Text Secondary | --color-muted | #5E6E7E |
| Text Tertiary/placeholder | — | #8A99A8 |
| Border(강) | --color-border | #B6C6D9 |
| Border(카드/입력, 목업 사용값) | — | #D9E3EF, #E3EAF3, #E8EEF6(구분선), #EDF2F8(연한 구분선) |
| Primary | --color-primary | #2C5CE6 |
| Primary Hover | --color-primary-hover | #2247B8 |
| Accent | --color-accent | #2E90D0 |
| Success | --color-success | #2F7D4F |
| Warning | --color-warning | #5C7DA3 |
| Danger | --color-danger | #B84A45 |
| Info Surface | --color-info-surface | #EAF2FA |
| 다크 서피스(관리자 사이드바, 멤버십 카드, 비디오) | — | #1B2733 |

원칙: Primary는 주요 CTA와 "현재 단계"에만. 상태 배지는 **중립 배경(#F2F6FB) + 1px #E3EAF3 테두리 + 6px 컬러 점(dot)** 으로 통일 — dot 색만 상태별로 변경(진행=Primary, 완료=Success, 대기=Warning #5C7DA3, 경고=Danger). 보라색·네온·그라디언트 AI 클리셰 금지.

### 타이포그래피
- 폰트: **Pretendard** (CDN: `pretendardvariable-dynamic-subset.min.css`), fallback: Apple SD Gothic Neo, Noto Sans KR, system-ui
- 스케일: display 40–56(랜딩 히어로) / h1 24–26 / h2 16–17(카드 제목) / body 13.5–15 / caption 11–12.5
- 큰 제목 letter-spacing: -0.5 ~ -1.5px. 대시보드 숫자는 `font-variant-numeric: tabular-nums`
- 대시보드 안에서는 hero 크기 제목 금지

### 형태·간격
- Radius: 카드 14–16px, 화면 프레임 20px, 버튼/배지/칩 999px(필), 입력 10–14px, 아이콘 박스 10–12px
- 버튼: Primary(파란 필, 화면당 다음 행동 1개, `box-shadow: 0 8px 20px rgba(44,92,230,.25)`) / Secondary(흰 배경 + 1px #D9E3EF) / Outline-Primary(1px #2C5CE6 테두리 + 파란 텍스트)
- 카드: 그림자 대신 **1px 테두리**(#E3EAF3), 카드 안 카드 금지, 패딩 18–24px
- 포커스/편집 중 입력: `1.5px solid #2C5CE6` + `box-shadow: 0 0 0 4px rgba(44,92,230,.07)`
- 강조 안내(callout): #EAF2FA 배경 + 1px #D9E3EF + info 아이콘
- 클릭 타깃 최소 40px(모바일 44px), WCAG AA 대비

### 레이아웃 (App Shell)
- **데스크톱**: 좌측 사이드바(수강생 248px 라이트 / 관리자 224px 다크 #1B2733) + 상단 60px 바(기수 스위처 필 + 상태 dot) + 본문. 본문 최대 폭 1200px, 관리자 테이블 1440px
- **모바일(390px 기준)**: 상단 바 + **하단 4탭**(홈 · 세션 · 대화방 · AI 질문), 탭바는 `rgba(255,255,255,.92)` + 상단 1px 구분선, 활성 탭만 Primary

## Screens / Views

### Turn 1 — 공개·수강생 (파일 내 배지 1a–1g)
- **1a 랜딩 (데스크톱 1440)**: 상단 네비(로고+메뉴+지원하기 필 버튼) → 히어로(모집 배지 필, 56px 헤드라인 "CEO가 직접 만드는 첫 번째 AI 결과물", CTA 2개, 통계 4개를 1px 세로 구분선으로) → 커리큘럼 섹션(4대 트랙 카드 4열 그리드: Claude Code/Design/Cowork/Harness Engineering, 각 카드 40px 아이콘 박스 + 제목 17px + 설명 14px) → AX 통합 모듈 callout. 히어로 배경 `linear-gradient(180deg,#FFF,#F2F6FB)`(중립 그라디언트만 허용).
- **1b Cohort Home (데스크톱 1440×900)**: 사이드바(홈 활성 = #EAF2FA 배경 + Primary 텍스트, 과제/대화방에 카운트 배지) + 인사말 + 2열 그리드(1.6fr:1fr). 좌: **My Build 카드**(5단계 스텝퍼: 문제 선택→레퍼런스→초안 만들기→코칭→회사 적용, 완료=파란 원+체크, 현재=파란 테두리 원, 미래=회색; 하단 코칭 메모 + CTA) + **This Week 카드**(정규 강의 Zoom 카드 + 과제 마감 D-1 카드, 마감은 danger dot). 우: 대화방 미리보기, 새 강의 영상(96×58 다크 썸네일 + "Drive · 읽기 전용"), AI 조교 진입 카드(#EAF2FA). 카드 5개 이하 원칙.
- **1c 세션 상세 (데스크톱 1440)**: 브레드크럼 → 좌(1.7fr): 세션 헤더(출석 상태 배지 + 일시) + 16:9 비디오 플레이어(#1B2733, "Google Drive · 읽기 전용" 자물쇠 배지, 진행 바) + 강의자료 카드(파일 행: 아이콘+이름+용량+다운로드, 하단 "자료 교체됨 — 변경 이력 보기" 캡션). 우(1fr): **영상 Q&A 패널**(사용자 말풍선 파란 우측 / AI 말풍선 #F2F6FB 좌측, 출처 칩 "영상 41:20" "자료 p.12", 불확실성 문구) + 연결된 과제 카드.
- **1d Cohort Home (모바일 390×844)**: 상태바(9:41) → 기수 스위처 + 알림/아바타 → "홈" 제목 → 다음 세션 카드(D-2 배지, Zoom 입장/강의자료 버튼 반반) → My Build 카드(3/5 단계 + 진행 바 52%) → 리스트 카드(과제 마감 D-1 붉은 아이콘 박스 / 새 영상 / 대화방 새 메시지 3, 각 행 34px 아이콘 박스 + 체브론) → 보충수업 배너(#EAF2FA) → 하단 4탭(대화방 탭에 빨간 카운트 배지).
- **1e 기수 대화방 (모바일)**: 헤더(뒤로+방 이름+멤버 수) → **고정 공지 바**(#EAF2FA, 핀 아이콘) → 메시지: 강사(아바타+역할 배지 "강사", 흰 말풍선 4px 모서리) / 파일 메시지 카드("Drive · 12.8MB · 참여자 읽기/쓰기") / **AI 조교 메시지**(#EAF2FA 말풍선 + "AI" 배지 + 출처 칩 + "강사 검수 대기" 캡션) / 내 메시지(파란 말풍선 우측, 읽음 수) → 입력 바(+ 버튼, 필 입력, 파란 전송 버튼).
- **1f AI 조교 (모바일)**: 헤더(파란 원 아이콘 + "18기 커리큘럼·자료·영상 최신 반영" 초록 dot) → 추천 질문 칩 4개 → 질문/답변. AI 답변 구조: **본문(번호 리스트) → 구분선 → "출처" 라벨 + 출처 칩 → 불확실성 문구** (D-25 답변·출처·불확실성 분리 원칙). 답변 아래 액션 칩: 대화방에 공유 / 코칭 예약 / 신고.
- **1g 지원서 (모바일, 비로그인 단계형)**: 진행 바(4/7) + Typeform식 한 화면 한 질문(24px 질문 + 보조 설명 + 큰 textarea 포커스 상태) + "로그인 없이 제출, 알림톡 접수번호" 안내 callout + 하단 이전(1fr)/다음(2fr) 버튼.

### Turn 2 — 관리자·동문·결제 (배지 2a–2h)
- **2a 관리자 운영 대시보드 (1440×860)**: 다크 사이드바(#1B2733, 활성 = rgba(44,92,230,.35)) + KPI 카드 4개(지원자/추천 유입 64%/입금 21⁄24/결과물 완성률, tabular-nums) + **전형 퍼널**(가로 바 5단계: 접수→검토→합격→입금→등록, 뒤 단계일수록 opacity·색 변화) + "오늘 처리할 것" 리스트(dot 우선순위) + 알림 발송 현황(성공/실패→SMS 대체/성공률).
- **2b 선발 관리 (1440)**: 상태 필터 필 칩(전체/접수/검토/합격/대기/불합격 + 카운트) + 검색 → 테이블(체크박스, 이름·직함, 회사·업종, 동기 요약, **추천 경로 배지**(#EAF2FA "17기 김성훈"), 상태 dot 배지, 지원일, "검토 →"). 하단 callout: "합격 변경 시 알림톡 T-02 + 초대 링크 + 인보이스 자동 발송".
- **2c 세션 인라인 편집 + Version Pack (1440×880, v2.6 핵심)**: 헤더에 "Version Pack v18 · 잠금됨" 자물쇠 배지 + "+ 세션 삽입" CTA. 좌 360px 세션 리스트: 완료 세션(초록 dot), **편집 중 세션**(1.5px 파란 테두리), **삽입된 special 세션**(파란 점선 테두리 + #EAF2FA + "special" 배지), 드래그 핸들(6-dot), 오프라인 보충("offline" 배지). 중앙: 제목 입력(편집 포커스 상태), 일시/실습 주제, **MDX 본문 에디터**(모노스페이스, #FBFCFE), "저장 즉시 수강생 화면 반영 · AI 조교 인덱스 자동 갱신" 초록 캡션, 미리보기/저장. 첨부 자료 행: "v2 · 오늘 교체됨" + "공개 예약 9/21 17:00" 배지 + 교체. 우: **변경 이력 타임라인**(D-15: 변경자·시각·공개·알림 여부) + Version Pack 정책 카드("잠금 후 변경은 이력+선택적 알림, 재생성은 다음 기수 복제 시").
- **2d 결제·세금계산서 관리 (1440)**: 세그먼트 탭(인보이스/입금 확인/세금계산서 큐) + **팝빌 mock 모드 callout**("발행 시뮬레이션·로그만, API 키 설정 시 실발행 / Toss 건은 Toss가 증빙") → 테이블(법인·수강생 / 2,200,000원 VAT포함 / 경로: 계좌이체·스마트스토어·Toss+flag 배지 / 상태 dot: 입금 완료·입금 대기 D+3(행 배경 #FFFBF9)·구매확정 대조 중·webhook 자동 paid / 증빙 / 날짜) → 하단 2카드: 세금계산서 요청 큐(국세청 전송 완료 배지), 경로별 집계.
- **2e 동문 홈 (데스크톱 1440)**: 상단 가로 네비(동문 홈/AS Q&A/디렉토리/아카이브/AI 브리프 + "멤버십 이용 중" 배지) → 인사말 + **90일 체크인 유도 문구**("그때 만든 결과물, 지금 어디까지 쓰이고 있나요? 3분 체크인 →") → 3열: AS Q&A(SLA 배지 "영업일 3일" + 질문 리스트) / 오피스아워(슬롯 칩: 마감=취소선, 선택=파란 테두리) + 동문 디렉토리(옵트인 안내 + 공개 프로필 행) / **멤버십 카드(다크 #1B2733**, 연 550,000원 VAT 포함, 만료일, 갱신 버튼) + 최신 브리프.
- **2f 내 결제·인보이스 (모바일)**: 금액 카드(2,200,000원 + 인보이스 번호 + "입금 대기" dot 배지 + **세로 상태 타임라인**: 발행 완료(초록 체크)→입금 확인 대기(파란 현재)→등록 확정(회색)) → 결제 방법(계좌이체 카드 = 파란 테두리 "권장" + 계좌 복사 / 스마트스토어 행) → 세금계산서 요청 카드. 하단 캡션 "입금 확인 시 알림톡 발송".
- **2g AI 뉴스·브리프 피드 (모바일)**: 카테고리 필 칩(전체/AI 뉴스/기술/기업 AX) → 카드 3종: ① 썸네일형 브리프(다크 그라디언트 130px + "의사결정 브리프 · 동문 전용" 배지 + 태그) ② 텍스트+외부 링크형(카테고리 배지 + 링크 캡션) ③ **잠금 카드**(자물쇠 + "수강생·수료생 공개 글 — 지원하고 열람하기"). 하단 4탭(AI 질문 활성).
- **2h 멤버십 (모바일)**: **다크 멤버십 카드**(AI4CEO MEMBERSHIP + "이용 중" 초록 dot + 이름·기수 + 만료 D-238 + 연 550,000원 VAT 포함) → 혜택 리스트 4행(전 기수 녹화본 read-only/전 기수 교재/AX 행사 초대권/피드 전체 열람) → 제한 안내 callout("Zoom·대화방·과제·AI 조교는 재학생 전용, 만료 시 자동 회수") → 하단 고정 "멤버십 갱신하기" Primary 버튼.

## Interactions & Behavior
- **상태 기반 화면 개방(Status-gated UX)**: 라우트 보호는 role + enrollments.status 조합. guest/applicant→공개+지원서, invoiced→결제 화면(2f), paid→등록 안내, in_training→LMS 전체(1b~1f), completed/alumni→동문(2e,2h). paid 전환 시 결제 화면은 닫히고 등록 화면이 열림.
- 상태 전환마다 알림톡 자동 발송(T-01~T-15). 화면에는 항상 "자동 발송" 사실을 callout으로 노출(2b, 2f 참고).
- My Build 스텝퍼: 현재 단계만 파란 테두리, 클릭 시 해당 단계 작업으로 이동. 강의·과제·코칭은 Build 단계의 보조 행동으로 연결.
- 대화방: 고정 공지 접기/펼치기, 파일 메시지는 Drive 업로드+권한 동기화(참여자 read/write), AI 답변은 "강사 검수 대기" 상태 표시 후 검수 시 배지 변경.
- AI 조교 답변: 스트리밍 렌더, 완료 후 출처 칩(탭 시 해당 세션/자료/영상 구간으로 이동)과 불확실성 문구, 액션(공유/코칭 예약/신고).
- 인라인 편집(2c): 저장 즉시 반영(승인 없음), 모든 편집·삽입·순서 변경은 D-15 이력 자동 기록, AI 조교 인덱스 자동 갱신. special 세션은 수료 기준 10회에 미포함. 세션 리스트는 드래그로 순서 변경.
- 지원서: 단계형(7스텝), 비로그인, 임시저장, 제출 즉시 알림톡+지원번호.
- 호버: 카드 테두리 #B6C6D9로 강화 정도만(그림자 추가 금지), 버튼은 Primary Hover #2247B8.
- 모바일 탭 전환·페이지 전환 < 1s, 공개 페이지 SSG.

## State Management
- 핵심 상태: `enrollments.status` (invited|invoiced|paid|enrolled|in_training|completed|dropped), `profiles.role` (guest|applicant|student|assistant|alumni|admin), `memberships`(active/expired), `builds`(5단계 stage + 회사 적용 여부), `applications.status`(received|reviewing|accepted|rejected|waitlist)
- 데이터: Supabase + TanStack Query 서버 상태 캐싱. RLS로 기수 소속 데이터 접근 제어(PRD 6.3)
- 대화방·알림 카운트는 실시간(Supabase Realtime) 갱신 대상

## Assets
- 폰트: Pretendard Variable (jsdelivr CDN)
- 아이콘: 목업에는 Lucide 스타일 인라인 SVG(20px 기본, stroke-width 2) — 구현 시 lucide-react 사용. 사용 아이콘: home, calendar, file-text, message-square, sparkles(4각 별), star, user, credit-card, bell, lock, play, pin, search, chevron-*, plus, arrow-up, check, info, link, terminal, layout, users, settings
- 이미지 없음(비디오 썸네일은 #1B2733 플레이스홀더). 실서비스에서는 Zoom 녹화 썸네일·수료생 사진으로 교체

## Files
- `AI4CEO Portal Screens.dc.html` — 전체 15개 화면. 상단 섹션 = Turn 2(관리자·동문·결제, 배지 2a–2h), 하단 섹션 = Turn 1(공개·수강생, 배지 1a–1g). 각 화면은 배지 라벨이 붙은 고정 폭 아트보드(데스크톱 1440px / 모바일 390×844px 폰 프레임)
- `PRD-요약-prd.txt` — PRD v2.6 전문 텍스트(기능 ID, 상태 머신, 데이터 모델, 알림 템플릿 참조용)
