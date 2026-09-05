import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthPage() {
  return <section className="narrow stack"><span className="eyebrow">AUTH</span><h1>로그인 / 회원가입</h1><p>Email/Password로 가입하면 별도 이메일 인증 없이 바로 사용할 수 있습니다.</p><AuthForm configured={isSupabaseConfigured()} /></section>;
}
