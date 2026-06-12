import type { Metadata } from "next";
import "./globals.css";
import { AgentationDev } from "@/components/agentation-dev";

export const metadata: Metadata = {
  title: "AI4CEO Portal",
  description: "CEO와 임원을 위한 바이브코딩 스쿨 포탈",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          // eslint-disable-next-line @next/next/no-page-custom-font
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="font-sans">
        {children}
        <AgentationDev />
      </body>
    </html>
  );
}
