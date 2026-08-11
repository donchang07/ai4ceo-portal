-- 동문 멤버십 '적용 대기' 상태 추가.
-- 멤버십은 구매만으로 이용할 수 없고 과정 수료 이후에만 적용되므로,
-- 구매는 됐지만 아직 수료 이력이 없는 구간을 나타낼 상태값이 필요하다.
-- ALTER TYPE ... ADD VALUE 는 같은 트랜잭션 안에서 그 값을 사용할 수 없어 별도 마이그레이션으로 분리한다.
alter type membership_status add value if not exists 'pending';
