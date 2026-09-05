import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthPage() {
  return <section className="narrow stack"><span className="eyebrow">AUTH</span><h1>로그인</h1><p>초기 MVP는 Email/Password 기반 Supabase Auth를 사용합니다.</p><AuthForm configured={isSupabaseConfigured()} /></section>;
}
