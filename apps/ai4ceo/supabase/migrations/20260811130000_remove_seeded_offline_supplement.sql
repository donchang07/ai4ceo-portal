-- 오프라인 보충 회차를 시드에서 제거한다.
-- 보충 수업은 교수 일정에 따라 비정기로 여는 것이라 기수 커리큘럼에 고정으로 존재하면 안 된다.
-- (20260719090100_seed.sql 이 18기에 'offline_supplement' 1건을 심어두고 있었다.)
--
-- 필요할 때는 /admin/curriculum 에서 직접 추가한다.

delete from public.sessions
where type = 'offline_supplement'
  and cohort_id = '00000000-0000-0000-0000-0000000000c1';
