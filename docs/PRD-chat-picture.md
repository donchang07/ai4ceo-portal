# PRD — chat-picture: 모바일 AI 챗 (사진 · PDF 하이브리드 RAG)

| 항목 | 내용 |
|---|---|
| 문서 버전 | v0.1 |
| 작성일 | 2026-07-20 |
| 제품명 | chat-picture |
| 목적 | 모바일 웹앱(PWA)에서 여러 사용자가 로그인해 AI와 대화하고, 카메라 사진과 PDF 문서(표·그림·다이어그램 포함)를 올려 RAG로 질문·답변하는 앱 |
| 스택 | Next.js 15 (App Router) · Vercel(Node + Python 서버리스) · Supabase(Auth·Postgres·pgvector·Storage) · OpenAI(임베딩) · 멀티 LLM |

> 이 PRD는 AI4CEO Portal(CEO 교육 LMS)과 **별개 제품**이다. 별도 Supabase 프로젝트·Vercel 프로젝트로 운영한다.

---

## 1. 개요 & 목표

chat-picture는 "말로 묻고, 사진 찍어 묻고, PDF 올려 묻는" 모바일 우선 AI 챗 앱이다.
핵심 가치는 **(1) 대화 맥락이 세션으로 저장·복원되는 개인화 챗**, **(2) 표/다이어그램까지 이해하는
PDF RAG**, **(3) 카메라로 찍은 사진을 바로 대화에 활용**하는 것이다.

### 성공 기준 (Success Criteria)
- SC-1: 모바일 브라우저에서 설치형 PWA로 동작(홈 화면 추가, 오프라인 셸).
- SC-2: 매직링크로 로그인한 사용자별로 대화 세션이 저장되고, 재접속 시 과거 세션을 불러온다.
- SC-3: 카메라로 촬영한 사진이 Supabase Storage(본인 폴더)로 업로드되고 대화에 첨부된다.
- SC-4: PDF를 올리면 표·본문·다이어그램 설명까지 추출→임베딩→pgvector 저장되고, 질문에
  **출처(문서명/페이지)** 와 함께 답한다.
- SC-5: 검색은 **유사도(vector) + 키워드(full text) 하이브리드**.
- SC-6: LLM을 사용자가 목록에서 선택할 수 있다.
- SC-7: Supabase는 **동시에 2개 프로젝트만 active** — 초과 시 과금(Pro 요금 + 일 사용요금)을 피한다.

---

## 2. 범위 (Scope)

**포함**: 매직링크 로그인, 대화 세션 저장/불러오기, 멀티 LLM 선택, 카메라 촬영→Storage,
PDF 업로드→하이브리드 RAG, 출처 표시, 모바일 PWA.
**제외(초기)**: 팀/공유 세션, 실시간 협업, 음성 입력(STT/TTS), 결제, 네이티브 앱 스토어 배포
(PWA로 대체).

---

## 3. 핵심 설계 원칙
1. **모바일 퍼스트 / PWA**: 화면·인터랙션은 모바일 기준. 설치형 PWA(manifest + 서비스워커).
2. **로그인 장벽 최소화**: 매직링크(이메일) 우선. 비밀번호는 후속 옵션.
3. **맥락 보존**: 모든 대화는 세션 단위로 저장, 과거 세션 로드 시 메시지 히스토리 복원.
4. **비용 통제**: Supabase active 프로젝트 2개 상한 준수(4.7 참조). Vercel 서버리스 타임아웃·동시성
   상한을 처음부터 넉넉히 설정.
5. **표/다이어그램까지 이해**: PDF 추출은 Node가 아니라 **Python(pdfplumber)** 로 한다.

---

## 4. 기능 요구사항 (Functional Requirements)

표기: P0 = 출시 필수, P1 = 출시 후, P2 = 백로그

### 4.1 인증 (Auth)
| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| A-1 | 매직링크 로그인 | Supabase Auth 이메일 매직링크. **Supabase 대시보드 Authentication → Email 세팅 필요**(SMTP 또는 커스텀). 최초 1회 매직링크, 이후 세션 유지 | P0 |
| A-2 | 멀티유저 | 여러 사용자가 각자 로그인, 데이터는 RLS로 본인 것만 접근 | P0 |
| A-3 | 로그아웃/세션 갱신 | @supabase/ssr 쿠키 기반 세션 | P0 |

### 4.2 대화 & 세션 (Chat)
| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| C-1 | 대화 | 텍스트 질의 → LLM 스트리밍 답변 | P0 |
| C-2 | 세션 저장 | 대화를 세션(chat_sessions)으로 저장, 메시지(chat_messages) 누적 | P0 |
| C-3 | 세션 불러오기 | 과거 세션 목록에서 선택해 히스토리 복원, 이어서 대화 | P0 |
| C-4 | 세션 관리 | 세션 제목 자동/수동, 삭제, 검색 | P1 |
| C-5 | 맥락 유지 | 답변 생성 시 해당 세션의 최근 메시지를 컨텍스트로 전달 | P0 |

### 4.3 LLM 선택
| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| L-1 | 모델 선택 | 화면에서 사용 가능한 LLM 목록 중 선택(예: Claude·GPT·Gemini 계열). 선택 모델로 답변·RAG 답변 생성 | P0 |
| L-2 | 모델 메타 | 모델별 컨텍스트·비용 표시(선택) | P2 |

### 4.4 카메라 & 사진
| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| M-1 | 카메라 촬영 | 모바일 카메라로 촬영(input capture) | P0 |
| M-2 | 사진 업로드 | 촬영/선택 사진을 **Supabase Storage(private 버킷 `chat-picture`)** 에 브라우저에서 직접 업로드. 경로 `${user.id}/${uuid}.jpg` | P0 |
| M-3 | 사진 대화 첨부 | 업로드한 사진을 메시지에 첨부, 비전 LLM으로 질의 | P1 |

### 4.5 PDF RAG (핵심)
| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| R-1 | RAG 진입 | 화면에서 "RAG 서비스" 클릭 → PDF 파일 선택 | P0 |
| R-2 | 업로드 정책 | PDF를 **Supabase Storage(private 버킷 `rag-pdfs`)** 에 브라우저에서 직접 업로드. 특히 **4MB 이상은 반드시 Storage 선업로드 후 RAG 처리**(Vercel inbound 4.5MB 제한). 경로 `${user.id}/${uuid}.pdf` | P0 |
| R-3 | 추출 | **pdfplumber(Python)** 로 텍스트 + 표(마크다운) + 다이어그램 설명 추출 | P0 |
| R-4 | 다이어그램 설명 | 페이지 이미지를 비전 LLM에 넣어 그림/다이어그램만 설명(없으면 고정 문구), concurrency 4~6 | P1 |
| R-5 | 임베딩·저장 | 청킹 → **OpenAI 임베딩** → **Supabase pgvector**(rag_chunks) 저장. 문서 메타는 rag_documents | P0 |
| R-6 | 원본 폐기 | 처리 후(성공/실패 무관) `finally`에서 Storage 원본 PDF 삭제 — 추출 텍스트/임베딩만 보존 | P0 |
| R-7 | 하이브리드 검색 | 유사도(vector cosine) + 키워드(Postgres full text)를 **RRF(reciprocal rank fusion)** 로 합치는 RPC | P0 |
| R-8 | 출처 표시 | 답변에 근거 문서명·페이지 표시 | P0 |
| R-9 | 문서 관리 | 내가 올린 문서 목록/삭제 | P1 |

---

## 5. 기술 아키텍처 (RAG 파이프라인) — 시행착오 방지 확정본

> Vercel(Next.js)에서는 표/다이어그램 복원이 되는 pdfplumber(Python)를 바로 못 쓰므로, 아래
> 아키텍처를 **처음부터** 이대로 만든다. (부록 A의 구현 프롬프트 원문과 vercel-rag 스킬 참조.)

```
브라우저
  │ 1. 카메라 사진 → Storage(chat-picture) 직접 업로드
  │ 2. PDF → Storage(rag-pdfs, private) 직접 업로드 (Next.js 서버를 거치지 않음)
  ▼
Next.js Route Handler (app/api/rag/ingest)   ← { storagePath, filename } 만 JSON 수신 (파일 본문 X)
  │ 3. createSignedUrl(120s) 생성 → Python 함수에 URL만 전달
  ▼
Vercel Python 함수 (api/pdf_extract.py, pdfplumber)
  │ 4. urllib.request.urlopen(signed_url) 로 자기가 직접 다운로드 (outbound → inbound 제한 무관)
  │ 5. 페이지별 text/table(md)/페이지이미지(base64) 추출
  ▼
Next.js Route Handler
  │ 6. 페이지 이미지 → 비전 LLM(동시성 4~6)로 다이어그램만 설명
  │ 7. [텍스트+표+다이어그램설명] 청킹 → OpenAI 임베딩 → pgvector insert
  │ 8. finally: Storage 원본 PDF 삭제
```

### 5.1 반드시 지킬 6가지 (구현 제약)
1. **PDF 추출 = Python(pdfplumber)**. Node의 pdf-parse/LangChain.js는 표 구조 복원 불가.
   레포 루트 `api/`(Next.js `app/api`와 별개)에 `.py` + `api/requirements.txt`. 핸들러는
   `http.server.BaseHTTPRequestHandler` 상속 `handler` 클래스, `do_POST`에서 `self.rfile`/`self.wfile`.
2. **업로드는 브라우저 → Supabase Storage 직접**. Next.js 서버는 파일 본문을 받지 않는다.
   Vercel inbound 본문 ~4.5MB 제한은 "브라우저→Next.js"와 "Next.js→Python 함수" 양쪽에 걸린다.
   Storage 경로는 UUID(`${user.id}/${uuid}.pdf`) — 한글/공백 파일명은 Storage 키 에러. 원래 파일명은 DB 컬럼(표시용).
3. **미들웨어 예외**: 로그인 미들웨어가 있으면 내부 전용 엔드포인트(`/api/pdf_extract` 등)를
   public/예외 경로에 추가(자기 API를 서버사이드 fetch할 때 `/login` 리다이렉트 방지).
4. **다이어그램**: `page.to_image()`로 페이지 렌더 → 비전 LLM에 페이지별 투입, "다이어그램/그림만
   설명, 없으면 고정 문구" 프롬프트. 동시성 4~6 제한.
5. **타임아웃**: Route Handler `export const maxDuration = 300`, Python은 `vercel.json`의
   `functions."api/pdf_extract.py".maxDuration = 300`. 플랜 상한 초과 시 낮춰 맞춤. `memory` 키는 불필요.
6. **에러 전파**: 하위 함수의 실제 에러 바디(HTTP 상태코드 + 원본 텍스트)를 그대로 상위로 전파
   (413/500/504 구분).

### 5.2 스토리지/DB
- **Storage 버킷**: `chat-picture`(카메라 사진), `rag-pdfs`(PDF 인제스트) — 둘 다 **private**,
  RLS `(storage.foldername(name))[1] = auth.uid()::text` 로 본인 폴더만 read/write/delete.
- **pgvector**:
  - `rag_documents`(id, user_id, filename, storage_path?, page_count, created_at)
  - `rag_chunks`(id, document_id, user_id, page, content, tsv tsvector, embedding vector(1536))
  - `chat_sessions`(id, user_id, title, model, created_at, updated_at)
  - `chat_messages`(id, session_id, user_id, role, content, attachments jsonb, sources jsonb, created_at)
- **하이브리드 검색 RPC**: vector cosine similarity + Postgres FTS(tsv)를 RRF로 결합해 상위 K 반환.
- 전 테이블 RLS(본인 데이터). rag_chunks 검색 RPC는 본인 문서 범위로 제한하거나 security definer + user_id 필터.

---

## 6. 화면 (모바일)
- **로그인** `/login`: 이메일 입력 → 매직링크 발송 안내.
- **홈/챗** `/`: 세션 목록(사이드/상단 드로어) + 대화 영역 + 입력바(텍스트·카메라·PDF·모델선택).
- **세션 목록** 드로어: 과거 세션 클릭 → 히스토리 복원.
- **모델 선택** 시트: LLM 목록 선택.
- **PDF RAG 시트**: 파일 선택 → 업로드 진행률 → 인제스트 상태(추출/임베딩/완료) → 완료 시 "이 문서에
  질문하기".
- **답변**: 스트리밍 + 출처 카드(문서명·페이지).
- **카메라**: 촬영 → 미리보기 → 첨부.

---

## 7. 비기능 요구사항 (Non-Functional)
- **Supabase 프로젝트 상한**: 동시에 **active 2개까지**. 초과 시 Pro 요금 + 일 사용요금 과금되므로,
  이 제품용 1개(+포탈 등 기존 1개) 이내로 유지. 안 쓰는 프로젝트는 pause.
- **API 키 세팅**: Supabase(URL/anon/service_role), OpenAI(임베딩), LLM 제공자 키. `.env`/`.env.local`
  로만, 클라이언트엔 NEXT_PUBLIC_ anon만 노출. service_role은 서버 전용.
- **성능/타임아웃**: 5.1-5 준수. 대용량 PDF는 페이지수×비전호출로 시간 누적 → 진행상태 UX 제공.
- **보안**: private 버킷 + RLS, 매직링크 리다이렉트 URL 화이트리스트, 서버 전용 키 분리.
- **PWA**: manifest + 서비스워커, 오프라인 셸(세션 목록 캐시).

---

## 8. 오픈 이슈 & 결정 필요
- **버킷/벡터DB 네이밍**: 요청상 벡터DB를 "chat-picture"로 언급 ↔ 아키텍처는 PDF 버킷 `rag-pdfs`.
  → 본 PRD는 사진 버킷 `chat-picture`, PDF 버킷 `rag-pdfs`, pgvector 테이블 `rag_documents/rag_chunks`로
  분리 정의. (제품/Supabase 프로젝트 이름을 chat-picture로 쓸지 확정 필요.)
- **LLM 목록 확정**: 선택 가능한 모델 세트(제공자·모델ID·비용) 확정 필요.
- **비전 모델**: 다이어그램 설명·사진 질의에 쓸 비전 모델 확정(비용/동시성).
- **매직링크 메일**: Supabase 기본 메일은 시간당 발송 제한 → 커스텀 SMTP 권장.
- **Vercel 플랜**: Python 함수 maxDuration 상한은 플랜별. Pro 이상 권장.

---

## 9. 마일스톤(초안)
- M0: Supabase 프로젝트·버킷·스키마·RLS + 매직링크 Auth + Next.js/Vercel + Python 함수 스캐폴드.
- M1: 챗 + 세션 저장/불러오기 + LLM 선택.
- M2: PDF RAG(pdfplumber 추출 → 임베딩 → pgvector) + 하이브리드 검색 + 출처.
- M3: 카메라→Storage + 사진 질의(비전) + PWA.
- M4: 다이어그램 설명·문서관리·세션관리 고도화.

---

## 부록 A. 구현 프롬프트 원문 (그대로 사용)

> RAG 기능을 Next.js(App Router) + Vercel + Supabase 환경에 추가할 때, 아래 프롬프트를 그대로 써서
> 처음부터 올바른 아키텍처로 만든다.

```
RAG 기능을 Next.js(App Router) + Vercel + Supabase 환경에 추가해줘. PDF를 업로드하면 표/레이아웃/다이어그램까지 포함해서 이해하고, 질문에 답할 수 있어야 해.

요구사항
- PDF 업로드 → 텍스트 + 표 + 다이어그램 설명까지 추출 → OpenAI 임베딩 → Supabase(pgvector) 저장
- 검색은 유사도(vector) + 키워드(full text) 하이브리드
- LLM은 기존에 쓰는 모델 목록 중에서 선택 가능하게
- 질문에 대해 출처(문서명/페이지)까지 같이 보여줘

아키텍처 (처음부터 이렇게 만들어줘 — 시행착오 방지)
1. PDF 추출은 Python(pdfplumber)로 한다. Node의 pdf-parse/LangChain.js는 표 구조를 복원 못 한다.
   Vercel은 Next.js와 같은 프로젝트 안에 Python 서버리스 함수를 네이티브로 지원한다: 레포 루트 api/
   디렉토리(Next.js의 app/api와 별개)에 .py 파일 + api/requirements.txt를 두면 자동 배포된다.
   핸들러는 http.server.BaseHTTPRequestHandler를 상속한 handler 클래스, do_POST(self)에서
   self.rfile/self.wfile 사용.
2. 파일 업로드는 브라우저 → Supabase Storage로 직접 올리게 하고, Next.js 서버는 파일 본문을 절대 직접
   받지 마라. Vercel 서버리스 함수는 inbound 요청 본문이 ~4.5MB로 제한되는데, 이 제한은
   "브라우저→Next.js"뿐 아니라 "Next.js→Python 함수" 내부 호출에도 똑같이 걸린다. 그래서:
   - 브라우저: Supabase JS로 Storage에 직접 업로드 (private 버킷, RLS로 본인 폴더만 접근)
   - Storage 오브젝트 경로는 ${user.id}/${crypto.randomUUID()}.pdf 처럼 UUID로 만들어라 (한글/공백
     파일명이 Storage 키 에러를 낸다). 원래 파일명은 DB 컬럼에 표시용으로만 저장.
   - Next.js Route Handler는 {storagePath, filename}만 JSON으로 받는다.
   - Route Handler는 createSignedUrl()로 짧은 유효기간 signed URL을 만들어 Python 함수에는 그 URL만
     전달한다. Python 함수는 urllib.request.urlopen(signed_url)로 자기가 직접 다운로드한다 (outbound
     fetch라 inbound 크기 제한과 무관).
   - 처리 끝나면(성공/실패 무관) finally에서 Storage 원본 PDF를 삭제해라 — 추출된 텍스트/임베딩만 남긴다.
3. 로그인 미들웨어를 쓴다면, 내부 전용 엔드포인트(/api/pdf_extract 등)는 반드시 public/예외 경로에
   추가해라. 안 그러면 Next.js가 자기 자신의 API를 서버사이드로 fetch할 때도 /login으로 리다이렉트당한다.
4. 다이어그램 설명이 필요하면 pdfplumber로 페이지를 이미지로 렌더링(page.to_image())해서 비전 LLM에
   페이지별로 넣어 설명을 받아라. 표/본문 텍스트는 이미 따로 뽑으니 다이어그램/그림만 설명하라고
   프롬프트에 명시하고, 없으면 "설명할 다이어그램 없음" 같은 고정 문구를 반환하게 해서 빈 설명이 노이즈로
   안 섞이게 해라. 여러 페이지를 동시에 호출하되 concurrency는 4~6개로 제한해라 (전부 순차/전부 병렬 둘
   다 비효율적이다).
5. 타임아웃을 처음부터 넉넉히 잡아라. 페이지 수 × 비전 모델 호출 시간이 누적되므로 기본값(짧으면 10초)
   으로는 금방 504가 난다. Next.js Route Handler는 export const maxDuration = 300;, Python 함수는
   vercel.json에 {"functions": {"api/pdf_extract.py": {"maxDuration": 300}}}로 설정해라. (플랜에 따라
   상한이 다르니 배포가 거부되면 낮춰가며 맞춰라.) memory 키는 Vercel의 Active CPU 과금 하에서는 무시되니
   굳이 넣지 마라.
6. 에러 메시지는 항상 하위 함수의 실제 에러 바디를 그대로 상위로 전파해라. "요청이 실패했어요" 같은
   뭉뚱그린 메시지 대신 HTTP 상태코드와 원본 에러 텍스트를 같이 보여줘야 413/500/504를 구분해서
   디버깅할 수 있다.

스토리지/DB
- Supabase Storage: private 버킷 하나 (rag-pdfs 같은 이름), RLS로
  (storage.foldername(name))[1] = auth.uid()::text 패턴 사용
- pgvector 테이블: 문서 테이블(rag_documents) + 청크 테이블(rag_chunks, embedding vector(1536))
- 하이브리드 검색은 vector cosine similarity + Postgres full text search를 reciprocal rank fusion으로
  합치는 RPC 함수로 만들어라

이 아키텍처로 처음부터 만들어줘. 빌드 확인 후 배포까지 해줘.
```

## 부록 B. 참고
- 프로젝트 내 `vercel-rag` 스킬(`.claude/skills/vercel-rag`): PDF RAG를 Vercel+Supabase에서 만들 때
  실제로 겪은 5가지 실패(pdf-parse DOMMatrix, 413, 504, 미들웨어 리다이렉트 등)와 해결책 정리 — 구현 시 필독.
