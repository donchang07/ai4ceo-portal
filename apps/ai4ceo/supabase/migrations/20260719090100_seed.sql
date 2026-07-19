-- Seed: 18기 cohort + curriculum_templates v18 (10주) + sessions + admin
-- Design Ref: PRD 1.6 커리큘럼 표준 v18. Apply AFTER schema migration.
-- NOTE: admin profile row is inserted only if the auth.users row already exists
--       (create the admin user via Supabase Auth first, then re-run this seed).

insert into curriculum_templates (id, name, version, description, is_active, snapshot)
values (
  '00000000-0000-0000-0000-0000000000a1',
  '표준 커리큘럼 v18',
  'v18',
  '4대 트랙(Claude Code·Design·Cowork·Harness) + AX 통합 모듈 10주',
  true,
  '{"tracks":["claude_code","claude_design","claude_cowork","harness"],"weeks":10}'
)
on conflict (id) do nothing;

insert into cohorts (id, name, recruit_start, recruit_end, edu_start, edu_end, capacity, status, curriculum_template_id, curriculum_version_label)
values (
  '00000000-0000-0000-0000-0000000000c1',
  '18기',
  '2026-07-19', '2026-08-31',
  '2026-09-07T18:00:00+09:00', '2026-11-09T21:00:00+09:00',
  24, 'active',
  '00000000-0000-0000-0000-0000000000a1',
  'v18'
)
on conflict (id) do nothing;

-- 18기 10주차 정규 세션 + 보충 1회
insert into sessions (cohort_id, week_no, title, starts_at, ends_at, type, track, description, content_version, is_published) values
('00000000-0000-0000-0000-0000000000c1',1,'오리엔테이션 + AI·LLM 핵심 이해와 바이브코딩 개요','2026-09-07T18:00:00+09:00','2026-09-07T21:00:00+09:00','regular_zoom','오리엔테이션 + AX','주요 LLM 비교 · Claude Code 설치·첫 실습 · [AX] CEO가 AI를 직접 다뤄야 하는 이유',1,true),
('00000000-0000-0000-0000-0000000000c1',2,'개발 환경 구축과 Claude Code 실전 세팅','2026-09-14T18:00:00+09:00','2026-09-14T21:00:00+09:00','regular_zoom','Claude Code','터미널·Python·Node 환경 · 첫 프로젝트 생성·디버깅',1,true),
('00000000-0000-0000-0000-0000000000c1',3,'에이전트 코딩 심화 — CLAUDE.md·스킬·컨텍스트 관리','2026-09-21T18:00:00+09:00','2026-09-21T21:00:00+09:00','regular_zoom','Claude Code + AX','[AX] 우리 회사 자동화 후보 도출, Build Brief 작성',2,true),
('00000000-0000-0000-0000-0000000000c1',4,'에이전트 하네스 개념 — 도구·권한·가드레일 설계','2026-09-28T18:00:00+09:00','2026-09-28T21:00:00+09:00','regular_zoom','Harness Engineering','평가 루프 · 장시간 자율 작업 안정화',1,true),
('00000000-0000-0000-0000-0000000000c1',5,'프로토타입·웹 UI 제작 — Vercel·Supabase 연동 챗봇','2026-10-05T18:00:00+09:00','2026-10-05T21:00:00+09:00','regular_zoom','Claude Design + AX','[AX] 부서별 PoC 설계',1,true),
('00000000-0000-0000-0000-0000000000c1',6,'지식노동 위임 — 문서·리서치·분석 도구 활용','2026-10-12T18:00:00+09:00','2026-10-12T21:00:00+09:00','regular_zoom','Claude Cowork','파일·브라우저·엑셀 도구 활용',1,true),
('00000000-0000-0000-0000-0000000000c1',7,'반복 업무 자동화 워크플로 구축','2026-10-19T18:00:00+09:00','2026-10-19T21:00:00+09:00','regular_zoom','Claude Cowork + AX','[AX] AX 조직·거버넌스, 보안·ROI',1,true),
('00000000-0000-0000-0000-0000000000c1',8,'회사 업무용 에이전트 하네스 구축 실습','2026-10-26T18:00:00+09:00','2026-10-26T21:00:00+09:00','regular_zoom','Harness Engineering','사내 데이터·RAG 연결 포함',1,true),
('00000000-0000-0000-0000-0000000000c1',9,'종합 프로젝트 — 내 회사 문제 하나를 구현','2026-11-02T18:00:00+09:00','2026-11-02T21:00:00+09:00','regular_zoom','종합 프로젝트','Claude Code + Design + Cowork · 1:1 점검·코칭',1,true),
('00000000-0000-0000-0000-0000000000c1',10,'종합 프로젝트 발표 + AX 로드맵','2026-11-09T18:00:00+09:00','2026-11-09T21:00:00+09:00','regular_zoom','발표 + AX','[AX] 우리 회사 AX 로드맵과 수료 후 90일 실행 계획',1,true),
('00000000-0000-0000-0000-0000000000c1',0,'오프라인 보충 1회차 — 1~5주차 복습','2026-10-17T15:00:00+09:00','2026-10-17T18:00:00+09:00','offline_supplement','보충수업','설치·환경 문제 해결 · Zoom 방송·녹화 없음',1,true)
on conflict do nothing;

-- 대화방
insert into chat_rooms (id, cohort_id, type, title, status)
values ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000c1','cohort','18기 대화방','open')
on conflict (id) do nothing;

-- 추천 코드
insert into referrals (code, label) values ('R17-KSH','17기 김성훈'), ('R17-LEE','17기 이수민')
on conflict (code) do nothing;

-- 커리큘럼 Version Pack (잠금)
insert into cohort_version_packs (cohort_id, version_label, change_summary, locked_at)
values ('00000000-0000-0000-0000-0000000000c1','v18','18기 표준 커리큘럼 스냅샷', now())
on conflict do nothing;

-- 관리자 프로필 (auth.users에 donchang0725@gmail.com 이 이미 있을 때만 role=admin 부여)
update profiles set role = 'admin', name = '장동인 교수'
where id in (select id from auth.users where email = 'donchang0725@gmail.com');
