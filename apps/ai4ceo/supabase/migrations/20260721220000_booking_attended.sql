-- prd-v3-cycle4 (Design Ref: docs/02-design/features/prd-v3-cycle4.design.md §1)
-- H-7 예약 관리 — 신청(status) 과 참석 여부(attended)를 분리해서 관리자가 기록.

alter table session_bookings add column if not exists attended boolean;
