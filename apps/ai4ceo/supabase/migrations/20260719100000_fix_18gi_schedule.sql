-- Fix 18기 개강일/정원: 공식 모집 안내(CEO를 위한 AI코딩스쿨(18기).docx) 기준으로 정정
-- 09/07(월) -> 09/09(수) 18:00, 매주 수요일. Zoom 강의라 정원 상한 없음(capacity: null).

update cohorts
set capacity = null,
    recruit_end = '2026-09-02',
    edu_start = '2026-09-09T18:00:00+09:00',
    edu_end = '2026-11-11T21:00:00+09:00'
where id = '00000000-0000-0000-0000-0000000000c1';

update sessions set starts_at = '2026-09-09T18:00:00+09:00', ends_at = '2026-09-09T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 1;
update sessions set starts_at = '2026-09-16T18:00:00+09:00', ends_at = '2026-09-16T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 2;
update sessions set starts_at = '2026-09-23T18:00:00+09:00', ends_at = '2026-09-23T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 3;
update sessions set starts_at = '2026-09-30T18:00:00+09:00', ends_at = '2026-09-30T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 4;
update sessions set starts_at = '2026-10-07T18:00:00+09:00', ends_at = '2026-10-07T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 5;
update sessions set starts_at = '2026-10-14T18:00:00+09:00', ends_at = '2026-10-14T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 6;
update sessions set starts_at = '2026-10-21T18:00:00+09:00', ends_at = '2026-10-21T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 7;
update sessions set starts_at = '2026-10-28T18:00:00+09:00', ends_at = '2026-10-28T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 8;
update sessions set starts_at = '2026-11-04T18:00:00+09:00', ends_at = '2026-11-04T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 9;
update sessions set starts_at = '2026-11-11T18:00:00+09:00', ends_at = '2026-11-11T21:00:00+09:00' where cohort_id = '00000000-0000-0000-0000-0000000000c1' and week_no = 10;
