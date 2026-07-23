export default function PortalLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-label="화면을 불러오는 중" role="status">
      <div className="h-8 w-48 rounded-lg bg-hairline" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-[15px] bg-hairline" />
        <div className="h-28 rounded-[15px] bg-hairline" />
        <div className="h-28 rounded-[15px] bg-hairline" />
      </div>
      <div className="h-64 rounded-[15px] bg-hairline" />
    </div>
  );
}
