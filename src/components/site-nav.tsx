"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const navItems = [
  ["/dashboard", "홈"],
  ["/groups", "스터디"],
  ["/library", "문제집"],
  ["/review", "오답노트"],
] as const;

export function SiteNav({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    for (const [href] of navItems) router.prefetch(href);
  }, [router]);

  return <nav className={mobile ? "mobile-nav" : "primary-nav"} aria-label={mobile ? "모바일 주요 메뉴" : "주요 메뉴"}>
    {navItems.map(([href, label]) => <Link href={href} prefetch key={href}>{label}</Link>)}
  </nav>;
}
