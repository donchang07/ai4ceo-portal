-- AI 브리프는 누구에게나 공개한다.
--
-- 기존에는 audience 로 수강생·동문 전용 글을 나누고, 공개 목록에서는 제목만 보여주며
-- 본문을 흐리게 처리했다. 티저로 지원을 유도하는 구성이었는데 신뢰를 깎는 방식이라 걷어낸다.
--
-- 화면에서 잠금 표시를 없애는 것만으로는 부족하다. RLS 가 여전히 비공개 글을 걸러내
-- 목록에서 사라져 버리므로, 정책과 기존 데이터를 함께 공개로 바꾼다.

update public.posts set audience = 'public' where audience <> 'public';

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select using (true);
