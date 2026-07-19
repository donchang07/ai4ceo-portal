// Design Ref: PRD 1.6 / handoff — representative 18기 data used as fallback
// when the Supabase schema is not yet applied. Real queries take precedence.

import { COHORT_18 } from "../core/constants";
import type {
  Application,
  Assignment,
  BuildStep,
  ChatMessage,
  Invoice,
  Material,
  Post,
  Session,
} from "./types";

const C = COHORT_18.id;

// 18기 10주차 표준 커리큘럼 v18 (PRD 1.6)
export const MOCK_SESSIONS: Session[] = [
  { id: "s1", cohort_id: C, week_no: 1, title: "오리엔테이션 + AI·LLM 핵심 이해와 바이브코딩 개요", starts_at: "2026-09-07T18:00:00+09:00", ends_at: "2026-09-07T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-1", description: "주요 LLM 비교 · Claude Code 설치·첫 실습 · [AX] CEO가 AI를 직접 다뤄야 하는 이유", content_version: 1, is_published: true, track: "오리엔테이션 + AX" },
  { id: "s2", cohort_id: C, week_no: 2, title: "개발 환경 구축과 Claude Code 실전 세팅", starts_at: "2026-09-14T18:00:00+09:00", ends_at: "2026-09-14T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-2", description: "터미널·Python·Node 환경 · 첫 프로젝트 생성·디버깅", content_version: 1, is_published: true, track: "Claude Code" },
  { id: "s3", cohort_id: C, week_no: 3, title: "에이전트 코딩 심화 — CLAUDE.md·스킬·컨텍스트 관리", starts_at: "2026-09-21T18:00:00+09:00", ends_at: "2026-09-21T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-3", description: "프롬프트·컨텍스트 관리 · [AX] 우리 회사 자동화 후보 도출, Build Brief 작성", content_version: 2, is_published: true, track: "Claude Code + AX" },
  { id: "s4", cohort_id: C, week_no: 4, title: "에이전트 하네스 개념 — 도구·권한·가드레일 설계", starts_at: "2026-09-28T18:00:00+09:00", ends_at: "2026-09-28T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-4", description: "평가 루프 · 장시간 자율 작업 안정화", content_version: 1, is_published: true, track: "Harness Engineering" },
  { id: "s5", cohort_id: C, week_no: 5, title: "프로토타입·웹 UI 제작 — Vercel·Supabase 연동 챗봇", starts_at: "2026-10-05T18:00:00+09:00", ends_at: "2026-10-05T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-5", description: "[AX] 부서별 PoC 설계", content_version: 1, is_published: true, track: "Claude Design + AX" },
  { id: "s6", cohort_id: C, week_no: 6, title: "지식노동 위임 — 문서·리서치·분석 도구 활용", starts_at: "2026-10-12T18:00:00+09:00", ends_at: "2026-10-12T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-6", description: "파일·브라우저·엑셀 도구 활용", content_version: 1, is_published: true, track: "Claude Cowork" },
  { id: "s7", cohort_id: C, week_no: 7, title: "반복 업무 자동화 워크플로 구축", starts_at: "2026-10-19T18:00:00+09:00", ends_at: "2026-10-19T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-7", description: "[AX] AX 조직·거버넌스, 보안·ROI", content_version: 1, is_published: true, track: "Claude Cowork + AX" },
  { id: "s8", cohort_id: C, week_no: 8, title: "회사 업무용 에이전트 하네스 구축 실습", starts_at: "2026-10-26T18:00:00+09:00", ends_at: "2026-10-26T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-8", description: "사내 데이터·RAG 연결 포함", content_version: 1, is_published: true, track: "Harness Engineering" },
  { id: "s9", cohort_id: C, week_no: 9, title: "종합 프로젝트 — 내 회사 문제 하나를 구현", starts_at: "2026-11-02T18:00:00+09:00", ends_at: "2026-11-02T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-9", description: "Claude Code + Design + Cowork · 1:1 점검·코칭 연계", content_version: 1, is_published: true, track: "종합 프로젝트" },
  { id: "s10", cohort_id: C, week_no: 10, title: "종합 프로젝트 발표 + AX 로드맵", starts_at: "2026-11-09T18:00:00+09:00", ends_at: "2026-11-09T21:00:00+09:00", type: "regular_zoom", place: null, zoom_url: "https://zoom.us/j/18-10", description: "[AX] 우리 회사 AX 로드맵과 수료 후 90일 실행 계획", content_version: 1, is_published: true, track: "발표 + AX" },
  { id: "sup1", cohort_id: C, week_no: 0, title: "오프라인 보충 1회차 — 1~5주차 복습", starts_at: "2026-10-17T15:00:00+09:00", ends_at: "2026-10-17T18:00:00+09:00", type: "offline_supplement", place: "별도 장소(대면)", zoom_url: null, description: "설치·환경 문제 해결, Claude Code 실행 막힘 해소 · Zoom 방송·녹화 없음", content_version: 1, is_published: true, track: "보충수업" },
];

export const MOCK_MATERIALS: Material[] = [
  { id: "m1", session_id: "s3", title: "3주차 실습 — CLAUDE.md 작성 가이드.pdf", file_path: "#", version: 2, publish_at: "2026-09-21T17:00:00+09:00" },
  { id: "m2", session_id: "s3", title: "Build Brief 템플릿.docx", file_path: "#", version: 1 },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: "a1", cohort_id: C, title: "Build Brief 작성 — 우리 회사 자동화 후보 1개", description: "3주차 AX 모듈 연계. 한 장짜리 문제 정의 제출.", due_at: "2026-09-24T23:59:00+09:00" },
  { id: "a2", cohort_id: C, title: "Claude Code 첫 실습 결과물 제출", description: "회사 업무용 스크립트 초안", due_at: "2026-09-17T23:59:00+09:00" },
];

export const MOCK_BUILD_STEPS: BuildStep[] = [
  { key: "problem", label: "문제 선택", state: "done" },
  { key: "reference", label: "레퍼런스", state: "done" },
  { key: "draft", label: "초안 만들기", state: "current" },
  { key: "coaching", label: "코칭", state: "future" },
  { key: "apply", label: "회사 적용", state: "future" },
];

export const MOCK_APPLICATIONS: Application[] = [
  { id: "ap1", name: "김성훈", company: "성훈파트너스", title: "대표", phone: "010-1111-2222", email: "sh@ex.com", motivation: "사내 반복업무 자동화로 AX 첫걸음을 떼고 싶습니다.", status: "received", referral_code: "R17-KSH", referral_label: "17기 김성훈", created_at: "2026-08-20T09:12:00+09:00" },
  { id: "ap2", name: "이정민", company: "정민리테일", title: "부사장", phone: "010-3333-4444", email: "jm@ex.com", motivation: "우리 회사 서비스 프로토타입을 직접 만들어보고 싶습니다.", status: "reviewing", referral_code: null, created_at: "2026-08-19T14:03:00+09:00" },
  { id: "ap3", name: "박도현", company: "도현테크", title: "CEO", phone: "010-5555-6666", email: "dh@ex.com", motivation: "에이전트 하네스로 장시간 자율 작업을 설계하고 싶습니다.", status: "accepted", referral_code: "R17-LEE", referral_label: "17기 이수민", created_at: "2026-08-18T11:20:00+09:00" },
  { id: "ap4", name: "최유진", company: "유진바이오", title: "대표이사", phone: "010-7777-8888", email: "yj@ex.com", motivation: "부서별 PoC 설계 방법론을 배우고 싶습니다.", status: "waitlist", referral_code: null, created_at: "2026-08-17T16:45:00+09:00" },
  { id: "ap5", name: "정우성", company: "우성물산", title: "회장", phone: "010-9999-0000", email: "ws@ex.com", motivation: "AX 로드맵을 임원진과 공유할 근거를 만들고자 합니다.", status: "rejected", referral_code: null, created_at: "2026-08-16T10:30:00+09:00" },
];

export const MOCK_INVOICES: Invoice[] = [
  { id: "iv1", number: "INV-18-0001", biz_name: "성훈파트너스", biz_reg_no: "123-45-67890", amount: 2200000, status: "paid", method: "bank_transfer", student_name: "김성훈", created_at: "2026-08-25T09:00:00+09:00", paid_at: "2026-08-26T13:20:00+09:00" },
  { id: "iv2", number: "INV-18-0002", biz_name: "도현테크", biz_reg_no: "222-33-44455", amount: 2200000, status: "issued", method: "bank_transfer", student_name: "박도현", created_at: "2026-08-25T09:05:00+09:00", paid_at: null },
  { id: "iv3", number: "INV-18-0003", biz_name: "정민리테일", biz_reg_no: null, amount: 2200000, status: "issued", method: "smartstore", student_name: "이정민", created_at: "2026-08-24T18:00:00+09:00", paid_at: null },
  { id: "iv4", number: "INV-18-0004", biz_name: "유진바이오", biz_reg_no: "333-44-55566", amount: 2200000, status: "paid", method: "toss", student_name: "최유진", created_at: "2026-08-23T12:00:00+09:00", paid_at: "2026-08-23T12:03:00+09:00" },
];

export const MOCK_POSTS: Post[] = [
  { id: "p1", board: "brief", title: "의사결정 브리프: 사내 에이전트 도입, 지금 결정할 3가지", excerpt: "도구·권한·가드레일을 어떻게 정할지 한 장으로 정리했습니다.", category: "ax", audience: "alumni", external_url: null, tags: ["AX", "거버넌스"], thumbnail: true, published_at: "2026-07-15T09:00:00+09:00" },
  { id: "p2", board: "ai_trend", title: "Claude 신규 모델 업데이트 — CEO가 알아야 할 변화", excerpt: "긴 컨텍스트·에이전트 성능 향상이 실무에 주는 의미.", category: "ai_news", external_url: "https://www.anthropic.com/news", audience: "public", tags: ["AI 뉴스"], thumbnail: false, published_at: "2026-07-12T09:00:00+09:00" },
  { id: "p3", board: "ai_trend", title: "RAG vs 파인튜닝 — 우리 회사엔 무엇이 맞나", excerpt: "사내 데이터 활용 관점의 기술 비교.", category: "tech", external_url: null, audience: "student", tags: ["기술", "RAG"], thumbnail: true, published_at: "2026-07-10T09:00:00+09:00" },
  { id: "p4", board: "brief", title: "부서별 PoC 설계 체크리스트", excerpt: "작게 시작해서 빠르게 검증하는 법.", category: "ax", audience: "student", external_url: null, tags: ["AX", "PoC"], thumbnail: false, published_at: "2026-07-08T09:00:00+09:00" },
];

export const MOCK_CHAT: ChatMessage[] = [
  { id: "c0", author: "운영 공지", role: "admin", body: "3주차 자료가 v2로 교체되었습니다. 세션 상세에서 확인하세요.", message_type: "notice", pinned: true, created_at: "2026-09-21T10:00:00+09:00" },
  { id: "c1", author: "장동인 교수", role: "instructor", body: "오늘 실습은 CLAUDE.md 작성부터 시작합니다. 터미널 준비해 주세요.", message_type: "text", created_at: "2026-09-21T17:30:00+09:00" },
  { id: "c2", author: "장동인 교수", role: "instructor", body: "3주차_실습_가이드.pdf", message_type: "file", fileMeta: { name: "3주차_실습_가이드.pdf", size: "12.8MB", permission: "Drive · 참여자 읽기/쓰기" }, created_at: "2026-09-21T17:32:00+09:00" },
  { id: "c3", author: "AI 조교", role: "assistant", body: "CLAUDE.md는 프로젝트 규칙을 담는 파일입니다. 1) 코드 스타일 2) 금지사항 3) 워크플로를 적으면 됩니다.", message_type: "ai_answer", sources: [{ label: "영상 41:20" }, { label: "자료 p.12" }], created_at: "2026-09-21T17:40:00+09:00" },
  { id: "c4", author: "나", role: "student", body: "감사합니다. 회사 규칙도 여기에 넣으면 되나요?", message_type: "text", mine: true, readCount: 12, created_at: "2026-09-21T17:42:00+09:00" },
];

export const RECOMMENDED_QUESTIONS = [
  "CLAUDE.md에는 무엇을 적어야 하나요?",
  "이번 주 과제 마감은 언제인가요?",
  "에이전트 하네스가 뭔가요?",
  "회사에 AI를 적용하려면 어디부터 시작하죠?",
];
