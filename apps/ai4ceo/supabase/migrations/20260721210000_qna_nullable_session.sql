-- prd-v3-cycle3 (Design Ref: docs/02-design/features/prd-v3-cycle3.design.md §1)
-- D-10 일반 Q&A 게시판 — 세션에 묶이지 않는 질문을 위해 session_id를 nullable로 변경.
-- RLS(sq_read/sq_insert/sa_read/sa_insert)는 전부 cohort_id 기준이라 무변경.

alter table session_questions alter column session_id drop not null;
