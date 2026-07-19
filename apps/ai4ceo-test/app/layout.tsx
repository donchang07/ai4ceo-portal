import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI4CEO QA 대시보드",
  description: "AI4CEO Portal 비즈니스 테스트 자동화 리포트 (읽기 전용)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
