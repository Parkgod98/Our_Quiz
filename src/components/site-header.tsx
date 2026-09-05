import Link from "next/link";
import { LogoutButton } from "@/components/account-actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const navItems = [
  ["/dashboard", "홈"],
  ["/groups", "스터디"],
  ["/library", "문제집"],
  ["/review", "오답노트"],
] as const;

export async function SiteHeader() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  }

  return <header className="site-header">
    <div className="header-inner">
      <Link className="brand" href={signedIn ? "/dashboard" : "/"}>Our Quiz</Link>
      {signedIn ? <>
        <nav className="primary-nav" aria-label="주요 메뉴">{navItems.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav>
        <div className="header-account"><LogoutButton /></div>
      </> : <div className="header-account"><Link className="header-login" href="/auth">로그인</Link><Link className="button-link small" href="/auth?mode=signup">시작하기</Link></div>}
    </div>
    {signedIn && <nav className="mobile-nav" aria-label="모바일 주요 메뉴">{navItems.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav>}
  </header>;
}
