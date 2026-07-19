# 08. LMS 세션 학습 (LMS) — 영상 · 자료 · 질의응답

세션 상세(`/portal/sessions/[id]`)의 실기능: 강의 영상 재생/이동, 강의자료 열람,
질의응답(수강생 질문 → 강사·동료·AI 조교 답변), 관리자의 영상/자료 연결.
2026-07-19 실 DB 연동으로 전환됨(이전 전면 목업). 데모 시드: 1주차 세션
(`ed04829b-148e-4ae8-8462-cf80b41666db`)에 YouTube 영상 1개 + 자료 2개.

관련 테이블: `videos`, `materials`, `session_questions`, `session_answers`(+RLS).
관련 파일: `session-interactive.tsx`(영상+RAG패널), `video-player.tsx`,
`session-qa.tsx`(스레드), `[id]/actions.ts`, `admin/curriculum/{editor,actions}.tsx`.

## 8.1 강의 영상 재생·이동 (LMS-V)

| ID | 시나리오 | 절차 | 기대결과 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| LMS-V01 | YouTube 영상 재생 | 재학생으로 1주차 세션 열기 | YouTube 플레이어 임베드, "읽기 전용" 배지, 재생 동작 | P0 | ✅ |
| LMS-V02 | 영상 없는 세션 | 영상 미연결 세션 열기 | "아직 강의 영상이 업로드되지 않았습니다" 플레이스홀더 | P1 | ✅ |
| LMS-V03 | mp4 직링크 재생 | 관리자가 `*.mp4` URL 연결 후 세션 열기 | 네이티브 `<video>` 컨트롤로 재생 | P1 | ❓ |
| LMS-V04 | Google Drive 영상 | 관리자가 `drive.google.com/file/d/.../view` 연결 | Drive preview 임베드 재생(재생만, seek 제한) | P1 | ❓ |
| LMS-V05 | 특정 지점 이동 (seek) — 핵심 | AI 답변의 "41:20" 출처 칩 클릭 | YouTube 플레이어가 해당 초로 이동 + 재생(postMessage seekTo) | P0 | ❓ 프로덕션 확인 필요 |
| LMS-V06 | mp4 seek | mp4 영상에서 타임스탬프 칩 클릭 | `video.currentTime` 이동 + 재생 | P1 | ❓ |
| LMS-V07 | Drive seek 무시 | Drive 영상에서 타임스탬프 칩 클릭 | 오류 없이 무시(Drive는 seek 미지원) | P2 | ✅ 코드상 no-op |
| LMS-V08 | 잘못된 URL | 관리자가 임베드 불가 URL 연결 | 깨진 iframe이라도 페이지는 정상(크래시 없음) | P2 | ❓ |
| LMS-V09 | 영상 열람 권한 | 관심자/비로그인이 영상 URL 직접 접근 | 세션 페이지 자체가 requireArchiveAccess로 차단(02번 매트릭스) | **P0 보안** | ✅ |
| LMS-V10 | 졸업 미가입자 영상 차단 | kaist 계정으로 세션 상세 접근 | `/alumni/membership`로 리다이렉트 — 영상 미노출 | **P0 돈** | ✅ |

## 8.2 강의자료 (LMS-M)

| ID | 시나리오 | 절차 | 기대결과 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| LMS-M01 | 자료 목록 표시 | 1주차 세션 열기 | DB의 자료 2개 제목·버전 표시 | P0 | ✅ |
| LMS-M02 | 자료 열기 | 자료 행의 다운로드 아이콘 클릭 | file_path URL을 새 탭으로 열기(`target=_blank`) | P0 | ✅ |
| LMS-M03 | 자료 없는 세션 | 자료 미연결 세션 | "등록된 강의자료가 없습니다" | P1 | ✅ |
| LMS-M04 | 자료 권한 | enrolled만 열람 | materials RLS: 해당 기수 수강생/admin만 select | P0 | ✅ |

## 8.3 질의응답 — 수강생 질문 (LMS-Q)

| ID | 시나리오 | 절차 | 기대결과 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| LMS-Q01 | 질문 등록 | 재학생이 질문 입력 후 전송 | session_questions insert, 작성자명과 함께 목록 최상단 표시 | P0 | ✅ 프로덕션 검증됨 |
| LMS-Q02 | 빈 질문 방어 | 공백만 입력 후 전송 | 등록 안 됨(클라이언트 가드) | P1 | ✅ |
| LMS-Q03 | 질문 카운트 | 질문 등록 후 | 헤더 배지 숫자 증가 | P2 | ✅ |
| LMS-Q04 | 작성자명 표시 | 질문 등록 | profiles RLS로 타인 이름이 가려지지 않도록 author_name 비정규화 저장·표시 | P0 | ✅ |
| LMS-Q05 | 비수강생 질문 차단 | 졸업/관심자 토큰으로 askQuestion 서버액션 직접 호출 | RLS(sq_insert=is_enrolled)로 거부 | **P0 보안** | ✅ |
| LMS-Q06 | 타 기수 질문 열람 차단 | 다른 기수 수강생이 이 세션 질문 조회 | sq_read=is_enrolled(cohort)로 빈 결과 | P0 | ✅ |

## 8.4 질의응답 — 답변 (강사·동료·AI) (LMS-A)

| ID | 시나리오 | 절차 | 기대결과 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| LMS-A01 | 동료 수강생 답변 | 재학생 B가 A의 질문에 "답변 달기" | is_instructor=false·is_ai=false 답변 저장, "수강생" 표기 | P0 | ✅ |
| LMS-A02 | 강사 답변 | admin(강사)이 답변 | is_instructor=true, **"강사" 배지** 표시 | P0 | ✅ (코드 검증; is_instructor=admin/assistant) |
| LMS-A03 | AI 조교 답변 저장 — 핵심 | 질문의 "AI 조교 답변 받기" 클릭 | RAG(fable-5)가 커리큘럼·강의자료 검색해 답변 생성 → **is_ai=true로 스레드 저장**, "AI" 배지 + 출처 | P0 | ✅ 프로덕션 검증됨 |
| LMS-A04 | AI 답변의 근거 표기 | AI 답변 확인 | 답변 말미 "출처: [세션/자료]" 포함, 자료에 없으면 일반지식임을 명시 | P0 | ✅ |
| LMS-A05 | 답변 순서 | 여러 답변 등록 | created_at 오름차순(먼저 단 답변이 위) | P1 | ✅ |
| LMS-A06 | 비수강생 답변 차단 | 관심자 토큰으로 answerQuestion 직접 호출 | RLS(sa_insert)로 거부 | **P0 보안** | ✅ |
| LMS-A07 | AI 답변 권한 | 졸업/관심자가 answerWithAi 직접 호출 | 서버액션이 canAccessLms 검사로 거부 | P0 | ✅ |
| LMS-A08 | 답변 후 즉시 반영 | 답변 등록 | revalidatePath로 새로고침 없이 스레드에 표시 | P1 | ✅ |

## 8.5 인라인 AI 조교 패널 (LMS-AI)

세션 우측 "AI 조교에게 질문" 패널(스레드와 별개, 스트리밍).

| ID | 시나리오 | 절차 | 기대결과 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| LMS-AI01 | 스트리밍 답변 | 패널에 질문 입력 | `/api/ai/tutor` 스트리밍, 토큰 단위 렌더 | P0 | ✅ |
| LMS-AI02 | 출처 타임스탬프 칩 | 답변에 "41:20" 형태 출처 | 재생(▶) 아이콘 칩으로 표시, 클릭 시 영상 seek | P0 | ❓ (LMS-V05와 동일 경로) |
| LMS-AI03 | 비타임스탬프 출처 | "자료 p.12" 같은 출처 | 일반 칩(클릭 불가) | P1 | ✅ |
| LMS-AI04 | 패널 권한 | 재학생/admin만 200 | 03번 AI-01과 동일(라우트 게이트) | P0 | ✅ |

## 8.6 관리자 — 영상·자료 연결 ("영상 올리는 과정") (LMS-ADM)

`/admin/curriculum`에서 세션 선택 후.

| ID | 시나리오 | 절차 | 기대결과 | 우선순위 | 상태 |
|---|---|---|---|---|---|
| LMS-ADM01 | 영상 연결 | 세션에 YouTube/Drive/mp4 URL + 제목 입력 후 "연결" | videos upsert, "저장됨", 수강생 세션 페이지에 즉시 반영 | P0 | ✅ |
| LMS-ADM02 | 영상 교체 | 다른 URL로 다시 "연결" | 기존 videos 행 update(중복 생성 안 함) | P0 | ✅ |
| LMS-ADM03 | 영상 제거 | URL 비우고 "연결" | videos 행 삭제, 수강생 화면 플레이스홀더 | P1 | ✅ |
| LMS-ADM04 | 자료 추가 | 제목 + URL 입력 후 "추가" | materials insert, 목록·수강생 화면 반영 | P0 | ✅ |
| LMS-ADM05 | 자료 삭제 | 자료 행 휴지통 클릭 | materials 삭제, 수강생 화면에서 사라짐 | P0 | ✅ |
| LMS-ADM06 | 세션 전환 시 상태 로드 | 좌측 목록에서 다른 세션 선택 | 해당 세션의 영상 URL·자료 목록으로 폼 갱신 | P1 | ✅ |
| LMS-ADM07 | 비관리자 쓰기 차단 | 재학생 토큰으로 setSessionVideo/addMaterial | RLS(videos_admin/materials_admin)로 거부 | **P0 보안** | ✅ |
| LMS-ADM08 | 저장 즉시 AI 반영 | 자료 추가 후 AI 조교에 관련 질문 | 커리큘럼 컨텍스트는 매 요청 재조회라 반영 (단, 첨부 파일 본문은 rag:sync 필요 — 아래 갭) | P1 | ⚠ 부분 |

## ⚠ 알려진 갭

1. **영상 진도 기록(D-4)**: `video_progress` 미사용 — 이어보기·진도율 없음.
2. **영상 업로드 알림(D-21)**: 영상 연결 시 수강생 알림톡/대화방 공지 자동 발송 미구현(문구만).
3. **첨부 자료 RAG 연동**: 관리자가 붙인 materials의 **파일 본문**은 AI 조교 벡터DB에 자동 반영되지 않음.
   현재 RAG는 CEO18기 디렉토리 파일을 `npm run rag:sync`로만 인덱싱. materials URL을 자동 수집·임베딩하는
   파이프라인은 별도 과제(LMS-ADM08 부분).
4. **답변 편집/삭제**: 등록한 질문·답변의 수정·삭제 기능 없음.
5. **자료 버전 교체·공개 예약**(D-28): 버전 관리·예약 공개 미구현(현재 version=1 고정).
6. **영상 전사/자막 기반 Q&A(D-22)**: AI 답변은 커리큘럼·강의자료 텍스트 기반이며 영상 자막/전사 인덱싱은 없음.
7. **LMS-V05/V06 seek**: 코드 구현됨. 프로덕션 실클릭 검증 필요(❓).
