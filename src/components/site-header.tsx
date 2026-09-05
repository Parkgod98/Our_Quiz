import Link from "next/link";
import { cookies } from "next/headers";
import { LogoutButton } from "@/components/account-actions";
import { SiteNav } from "@/components/site-nav";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function SiteHeader() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    const cookieStore = await cookies();
    signedIn = cookieStore.getAll().some(({ name, value }) => name.startsWith("sb-") && name.includes("auth-token") && Boolean(value));
  }

  return <header className="site-header">
    <div className="header-inner">
      <Link className="brand" href={signedIn ? "/dashboard" : "/"}>Our Quiz</Link>
      {signedIn ? <>
        <SiteNav />
        <div className="header-account"><LogoutButton /></div>
      </> : <div className="header-account"><Link className="header-login" href="/auth">로그인</Link><Link className="button-link small" href="/auth?mode=signup">시작하기</Link></div>}
    </div>
    {signedIn && <SiteNav mobile />}
  </header>;
}
