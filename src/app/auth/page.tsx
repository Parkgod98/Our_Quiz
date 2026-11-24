import { AuthForm, type AuthMode } from "@/components/auth-form";
import { groupPath } from "@/lib/group-navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthQuery = Record<string, string | string[] | undefined>;

export default async function AuthPage({ searchParams }: { searchParams: Promise<AuthQuery> }) {
  const { mode, group, tab, expired } = await searchParams;
  const configured = isSupabaseConfigured();
  let initialMode: AuthMode =
    mode === "signup" || mode === "reset" ? mode : "login";
  let linkExpired = expired === "1";
  if (mode === "update" && configured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    initialMode = data.user ? "update" : "reset";
    linkExpired = !data.user;
  }
  return <section className="auth-page">
    <div className="auth-copy">
      <span className="eyebrow">OUR QUIZ</span>
      <h1>함께 공부한 기록을<br />차곡차곡 쌓아보세요.</h1>
      <p>스터디 문제부터 오답 복습까지 한곳에서 이어집니다.</p>
    </div>
    <AuthForm key={initialMode} configured={configured} initialMode={initialMode} linkExpired={linkExpired}
      destination={groupPath(group, tab) ?? "/dashboard"} />
  </section>;
}
