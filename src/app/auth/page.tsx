import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <section className="auth-page"><div className="auth-copy"><span className="eyebrow">OUR QUIZ</span><h1>함께 공부한 기록을<br />차곡차곡 쌓아보세요.</h1><p>스터디 문제부터 오답 복습까지 한곳에서 이어집니다.</p></div><AuthForm configured={isSupabaseConfigured()} initialMode={mode === "signup" ? "signup" : "login"} /></section>;
}
