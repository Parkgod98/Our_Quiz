import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Our Quiz | 함께 풀고 다시 배우는 스터디",
  description: "스터디원과 같은 문제를 풀고, 자동 저장된 학습 기록과 오답을 함께 관리하세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><SiteHeader /><main className="page-shell">{children}</main></body></html>;
}
