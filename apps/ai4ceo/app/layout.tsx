import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AgentationDev } from "@/components/agentation-dev";

export const metadata: Metadata = {
  title: "AI4CEO Portal",
  description: "CEO와 임원을 위한 바이브코딩 스쿨 포탈",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2C5CE6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="font-sans">
        {children}
        <AgentationDev />
      </body>
    </html>
  );
}
