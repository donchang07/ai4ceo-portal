/** @type {import('next').NextConfig} */
// 대시보드 빌드는 tests/ (Playwright/노드 스크립트)를 절대 import 하지 않는다.
// next build 는 app/ 서버컴포넌트만 컴파일하며 테스트 실행을 포함하지 않는다.
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // 대시보드가 런타임에 fs로 읽는 리포트 JSON을 서버리스 함수 번들에 반드시 포함시킨다.
  outputFileTracingIncludes: {
    "/": ["./tests/report/latest.json"],
  },
};

export default nextConfig;
