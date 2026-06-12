# Design Direction — AI4CEO Portal

> Brand + Product Design Guide  
> 작성일: 2026-06-12  
> 기반: `docs/brandvoice.md`, `ai4ceo-portal-PRD-v1.9.md`

## 1. Design Principle

AI4CEO Portal의 디자인은 "AI를 멋져 보이게 하는 화면"이 아니라 "CEO가 오늘 무엇을 해야 하는지 판단하게 해주는 화면"이어야 한다.

핵심 원칙:

1. **Executive clarity:** 중요한 정보는 한눈에, 다음 행동은 한 번에.
2. **Quiet confidence:** 과장된 그래픽보다 정돈된 정보 구조와 안정적인 여백.
3. **Outcome first:** 강의 목록보다 결과물, 과제, 다음 세션, 회사 적용 흐름을 우선.
4. **Trust by permission:** 파일, 영상, 프로필, AI 답변의 공개 범위와 출처를 명확히 표시.
5. **Low-friction support:** 컴퓨터 사용이 익숙하지 않은 사용자도 헤매지 않도록 액션을 줄이고 문구를 분명히.

## 2. Brand Personality to Visual System

| Brand Trait | Visual Translation |
|---|---|
| 신뢰감 있는 | 선명한 정보 계층, 차분한 배경, 과도한 장식 제거, 권한 상태 배지 |
| 실행 중심의 | 대시보드 첫 화면에 "다음 행동" 카드, 체크리스트, 진행 상태 |
| 쉽게 풀어주는 | 기술 용어 옆에 짧은 한글 설명, 상태별 도움말, 빈 상태 안내 |
| 절제된 자신감 | 강한 대비를 CTA와 중요 상태에만 사용, 과한 애니메이션 배제 |
| 따뜻한 운영감 | 완곡한 안내 문구, 오류 시 복구 버튼, 보충 세션/도움 요청 진입점 |

## 3. Color System

AI4CEO는 흔한 AI 서비스의 보라색/네온 그라디언트 이미지를 피한다. 대신 경영진 대상 서비스에 맞는 옅은 블루 중립 기반에, 신뢰와 실행을 나타내는 K bank 스타일의 선명한 단색 블루를 핵심 강조색으로 사용한다.

### Palette

| Role | Token | Hex | Usage |
|---|---|---:|---|
| Background | `--color-canvas` | `#F2F6FB` | 전체 페이지 배경. 옅은 블루 오프화이트 |
| Surface | `--color-surface` | `#FFFFFF` | 테이블, 입력 영역, 반복 카드 |
| Surface Muted | `--color-surface-muted` | `#E8F0F8` | Cohort Home 보조 영역, 읽기 전용 영역, 사이드바 |
| Text Primary | `--color-ink` | `#1B2733` | 본문과 제목 |
| Text Secondary | `--color-muted` | `#5E6E7E` | 보조 설명, 메타 정보 |
| Border | `--color-border` | `#B6C6D9` | 카드, 테이블, 입력 필드 |
| Primary | `--color-primary` | `#2C5CE6` | 주요 CTA, 현재 단계, 핵심 상태 |
| Primary Hover | `--color-primary-hover` | `#2247B8` | CTA hover |
| Accent | `--color-accent` | `#2E90D0` | 알림, 중요한 일정, 새 항목 (밝은 스카이블루) |
| Success | `--color-success` | `#2F7D4F` | 제출 완료, 권한 정상 |
| Warning | `--color-warning` | `#5C7DA3` | 권한 동기화 필요, 마감 임박 (스틸블루) |
| Danger | `--color-danger` | `#B84A45` | 삭제, 권한 오류, 접근 불가 |
| Info | `--color-info` | `#3E7BAE` | AI 답변 출처, 영상 요약 |
| Info Surface | `--color-info-surface` | `#EAF2FA` | AI 답변 면, feature 카드 배경 |

### Color Rules

- 배경은 옅은 블루 오프화이트를 기본으로 하고, 면(surface)은 흰색으로 대비를 준다.
- Primary는 K bank 스타일의 선명한 단색 블루로, CTA와 현재 단계에만 사용한다.
- 네온·그라디언트·보라색 AI 클리셰는 쓰지 않는다. 블루는 단색 위주로 절제해서 쓴다.
- Accent(밝은 스카이블루)는 알림, 새 영상, 마감 임박처럼 사용자의 주의가 필요한 곳에 제한한다.
- 상태 배지는 중립 배경 + 컬러 점(dot)으로 통일해 화면당 색이 분산되지 않게 한다. success(녹색)·danger(적색)만 의미상 유지하고 나머지는 블루 계열로 둔다.
- Danger는 정말 복구가 필요한 상태에만 쓴다.

## 4. Typography

### Korean

- Primary font: `Pretendard`
- Fallback: `Apple SD Gothic Neo`, `Noto Sans KR`, `system-ui`, `sans-serif`
- CSS font-family: `"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`
- Web font source: Pretendard 공식 CDN 또는 프로젝트 로컬 번들 중 하나를 사용한다. 운영 서비스에서는 로딩 안정성을 위해 로컬 번들을 우선 검토한다.

### English / Numbers

- Use the same family for consistency.
- Tabular numbers for dashboard metrics and schedules.

### Type Scale

| Token | Size | Line Height | Usage |
|---|---:|---:|---|
| `display` | 40 | 52 | 랜딩 첫 화면 H1만 사용 |
| `h1` | 30 | 40 | 페이지 제목 |
| `h2` | 24 | 34 | 주요 섹션 |
| `h3` | 20 | 30 | 카드 그룹 제목 |
| `body` | 16 | 26 | 본문 |
| `body-sm` | 14 | 22 | 메타, 도움말, 테이블 |
| `caption` | 12 | 18 | 배지, 상태, 보조 라벨 |

Rules:

- 모든 화면, 관리자 콘솔, 랜딩 페이지, 알림 미리보기, 표/카드/버튼 텍스트는 Pretendard를 기본으로 한다.
- 글자 간격은 기본값을 유지한다.
- 버튼 안 텍스트는 짧게 쓴다.
- 대시보드 안에서는 hero 크기 제목을 쓰지 않는다.
- 긴 한국어 단어가 버튼 안에서 넘치지 않도록 최소 너비와 줄바꿈 정책을 둔다.

## 5. Iconography

### Icon Library

- Primary icon library: `Lucide`
- Source: `https://lucide.dev`
- Rationale: Lucide works naturally with shadcn/ui, has a restrained line style, and fits AI4CEO Portal's calm executive product tone.

### Icon Style

- Stroke style: Lucide default line style.
- Default size: `20px` for navigation and toolbar icons.
- Compact size: `16px` for table actions, badges, and metadata.
- Large size: `24px` only for major empty states or section headers.
- Stroke width: default Lucide stroke width unless a component requires visual correction.
- Icons should support function, not decoration.
- Every icon-only button must have a tooltip or accessible label.
- Do not mix Lucide with Phosphor, Heroicons, or Radix Icons in the same product surface unless a missing icon requires a one-off exception.

### Recommended Icon Mapping

| Product Area | Lucide Icons | Usage |
|---|---|---|
| Cohort Home | `LayoutDashboard`, `ListChecks` | Main dashboard, today's actions |
| Sessions / Schedule | `CalendarDays`, `Clock`, `Video` | Session list, time, Zoom lecture |
| Lecture Replay | `PlayCircle`, `Captions`, `BookOpen` | Video playback, transcript, materials |
| Assignments | `ClipboardList`, `FileCheck`, `Timer` | Homework, submission status, deadline |
| Chat Room | `MessagesSquare`, `Pin`, `Reply` | Cohort chat, pinned message, reply |
| Google Drive Files | `Folder`, `FileText`, `Upload`, `Download` | Shared folder, file card, upload/download |
| Permission Policy | `Lock`, `Eye`, `PenLine`, `ShieldCheck` | Read-only, view access, write access, admin verified |
| AI Tutor | `Sparkles`, `Bot`, `MessageCircleQuestion`, `SearchCheck` | Ask AI, AI answer, question, cited source |
| Notifications | `Bell`, `Mail`, `MessageSquareText` | Alimtalk/email/chat notices |
| Admin | `Settings`, `SlidersHorizontal`, `UserCog` | Admin settings, filters, user management |
| Billing | `ReceiptText`, `BadgeCheck`, `Building2` | Invoice, payment confirmed, company billing |
| Alumni Profile | `UserRound`, `IdCard`, `Globe`, `Users` | Profile, public card, public visibility, alumni |
| Status | `CheckCircle`, `AlertTriangle`, `CircleDashed`, `XCircle` | Success, warning, pending, error |

### Usage Rules

- Use icon + text for primary navigation and important actions.
- Use icon-only buttons for repeated tool actions such as edit, delete, pin, filter, upload, download, and sync.
- Keep icon semantics stable across the product. Example: `Lock` always means restricted/read-only, never "secure and recommended."
- Permission icons must be paired with text labels such as `읽기 전용`, `함께 수정`, or `관리자만`.
- AI icons should be understated. Avoid making every AI-related element sparkle.

## 6. Layout

### App Shell

- Desktop: left sidebar + top cohort switcher + main content.
- Mobile: top bar + bottom navigation for 핵심 4개: 홈, 세션, 대화방, AI 질문.
- Max content width: `1200px`.
- Admin screens may use wider table layout up to `1440px`.

### Spacing

| Token | Value | Usage |
|---|---:|---|
| `space-1` | 4 | icon gap, compact cell |
| `space-2` | 8 | button internal gap |
| `space-3` | 12 | form row gap |
| `space-4` | 16 | card padding compact |
| `space-5` | 20 | panel padding |
| `space-6` | 24 | section gap |
| `space-8` | 32 | page section gap |

### Radius

- Cards: `8px`.
- Buttons: `6px`.
- Inputs: `6px`.
- Badges: `999px` only for compact status pills.
- Avoid large rounded decorative panels.

## 7. Core Screens

### 7.1 Cohort Home

Purpose: 사용자가 로그인 후 바로 "오늘 무엇을 해야 하는지" 판단한다.

Required blocks:

1. **Next Session:** 다음 Zoom/오프라인 세션, 시간, 장소/링크, 준비물.
2. **Today’s Actions:** 미제출 과제, 새 영상, 확인할 공지.
3. **My Build:** 결과물 진행 단계와 다음 행동.
4. **Cohort Activity:** 새 대화방 메시지, 새 Drive 파일, 고정 공지.
5. **Ask AI:** 현재 기수 맥락으로 질문하기.

Design notes:

- 첫 화면은 카드 5개 이하로 시작한다.
- 가장 중요한 CTA는 하나만 primary로 둔다.
- 각 카드는 상태, 이유, 다음 행동 순서로 구성한다.

### 7.2 Session Detail

Purpose: 강의, 영상, 자료, 과제, 질문을 한 화면에서 연결한다.

Required elements:

- Session title, week number, schedule.
- Zoom link or completed state.
- Drive video player/read-only label.
- Materials list with permission status.
- Related assignment.
- Video Q&A panel.
- "Ask about this session" button.

### 7.3 Chat Room

Purpose: 카카오톡처럼 익숙하지만, 과제·공지·파일·AI 답변이 흐름 안에 남는다.

Design notes:

- 일반 메시지와 시스템 공지를 시각적으로 구분한다.
- 고정 메시지는 상단에 얇은 persistent bar로 표시한다.
- 파일 메시지는 Drive 아이콘, 파일명, 권한 배지, 관련 세션/과제 링크를 포함한다.
- AI 답변은 사람 메시지와 구분되는 soft info surface를 사용하고, 출처를 접을 수 있게 표시한다.

### 7.4 AI Tutor

Purpose: 일반 챗봇이 아니라 현재 화면 맥락을 이해하는 질문 도구로 보이게 한다.

Required elements:

- Context label: "이 질문은 4주차 영상 기준입니다."
- Source cards: 영상, 과제, Drive 파일, 대화 메시지.
- Confidence/limit note: "현재 자료 기준" 또는 "강사 검수 필요".
- Escalate to instructor action.

### 7.5 Drive Permission Management

Purpose: 관리자와 운영자가 권한 문제를 빠르게 찾고 복구한다.

Required elements:

- Folder purpose: chat_shared, lecture_video, assignment, admin_only.
- Expected permission.
- Actual permission status.
- Sync status.
- Last checked time.
- Fix action.

### 7.6 Alumni Profile

Purpose: 선택형 공개 프로필. 강제 느낌이 없어야 한다.

Design notes:

- 기본 상태는 "비공개"로 명확히 보인다.
- 공개 범위 선택을 저장 전 다시 요약한다.
- "작성하지 않아도 괜찮습니다" 문구를 빈 상태에 둔다.

## 8. Component Rules

### Buttons

- Primary: 주요 다음 행동 1개.
- Secondary: 보조 행동.
- Ghost/Icon: 반복 도구, 테이블 액션.
- Destructive: 삭제, 권한 회수, 공개 해제 등 되돌리기 어려운 행동.

Button copy examples:

- "과제 제출하기"
- "영상 보기"
- "AI에게 질문하기"
- "Drive 권한 확인"
- "버전 팩 잠금"

### Status Badges

Use compact badges for:

- `읽기 전용`
- `함께 수정`
- `권한 확인 필요`
- `제출 완료`
- `마감 임박`
- `강사 검수 필요`
- `비공개`
- `동문 공개`
- `전체 공개`

### Tables

Admin tables should be dense but readable:

- Row height: 44-52px.
- Sticky header for long lists.
- Inline status badges.
- Row actions via icon buttons with tooltips.
- Bulk actions only where 운영자가 실제로 반복 처리한다.

### Cards

Cards are for individual repeated items or dashboard widgets only.

- Do not put cards inside cards.
- Do not make every page section a floating card.
- Keep border radius at 8px.
- Use borders more than shadows.

### Forms

- Group CEO/company/payment/privacy fields clearly.
- Required fields should be explicit.
- Save states: 저장 중, 저장됨, 확인 필요.
- For privacy/public profile, show preview and visibility before publish.

## 9. Interaction Patterns

### Next Action Pattern

Every major screen should answer:

1. 현재 상태는 무엇인가?
2. 왜 중요한가?
3. 다음에 무엇을 하면 되는가?

Example:

- 상태: "5주차 강의 영상이 업로드되었습니다."
- 이유: "다음 과제는 이 영상의 실습 내용을 기준으로 진행됩니다."
- 행동: "영상 보기"

### Contextual AI Pattern

AI question entry points should carry context automatically:

- From video: session + transcript + materials.
- From assignment: assignment + submission + feedback.
- From chat: recent thread + pinned notice + related entity.
- From Drive file: file metadata + extracted text if available.

### Permission Transparency Pattern

Any file/video/profile surface should show:

- Who can view.
- Who can edit.
- Whether external sharing is allowed.
- What changed recently if permissions changed.

## 10. Landing Page Direction

The landing page should not feel like a generic SaaS hero or AI hype page.

Hero direction:

- H1 should be literal and confident: "AI4CEO Portal" or "CEO를 위한 바이브코딩 스쿨".
- Supporting copy should explain the offer: "10주 동안 배우고, 만들고, 회사에 적용할 첫 결과물을 완성합니다."
- First viewport should show evidence of the actual service: cohort schedule, Build progress, session/video/chat UI preview.
- Avoid abstract AI brain illustrations, glowing gradients, or stock business people.

Suggested hero copy:

- H1: "AI4CEO Portal"
- Subcopy: "CEO와 임원이 AI와 vibe coding을 배우고, 우리 회사에 적용할 첫 결과물을 만드는 기수제 실행 포탈."
- CTA: "과정 살펴보기"
- Secondary CTA: "지원하기"

## 11. Accessibility & Trust

- Body text contrast must meet WCAG AA.
- Click targets should be at least 40px high.
- Important actions must not rely on color alone.
- File/video permission states need text labels.
- AI answers should separate answer, source, and uncertainty.
- Public profile changes require clear confirmation.

## 12. Visual Don'ts

- Do not use purple or gradient/neon AI visuals as the main identity. The brand primary is a solid K bank-style blue, never a gradient.
- Do not use playful chat stickers or excessive emoji.
- Do not make the admin dashboard look like a marketing landing page.
- Do not bury critical actions under vague menus.
- Do not show public/profile/file permission states only after publish.
- Do not use large decorative cards inside other cards.
- Do not use vague AI copy such as "AI가 알아서 도와드립니다."

## 13. Design Tokens Draft

```css
:root {
  --font-sans: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;

  --color-canvas: #F2F6FB;
  --color-surface: #FFFFFF;
  --color-surface-muted: #E8F0F8;
  --color-ink: #1B2733;
  --color-muted: #5E6E7E;
  --color-border: #B6C6D9;
  --color-primary: #2C5CE6;
  --color-primary-hover: #2247B8;
  --color-accent: #2E90D0;
  --color-success: #2F7D4F;
  --color-warning: #5C7DA3;
  --color-danger: #B84A45;
  --color-info: #3E7BAE;
  --color-info-surface: #EAF2FA;

  --radius-card: 8px;
  --radius-control: 6px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
}
```

## 14. One-Sentence Design North Star

AI4CEO Portal should feel like a private executive operations room for learning AI: calm, structured, trustworthy, and always oriented toward the next useful action.
