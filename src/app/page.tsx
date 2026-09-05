import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const features = [
  ["같은 문제로 함께 공부", "스터디에 문제집을 추가하면 모든 멤버가 같은 문제로 학습할 수 있어요."],
  ["풀던 곳에서 그대로", "답안이 자동으로 저장돼 긴 문제집도 부담 없이 나눠서 풀 수 있어요."],
  ["틀린 문제는 자동으로 정리", "오답과 반복해서 틀린 주제를 모아 필요한 부분만 다시 복습할 수 있어요."],
];

export default async function Home() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/dashboard");
  }

  return <div className="landing-page">
    <section className="hero service-hero">
      <span className="eyebrow">함께 만드는 공부 습관</span>
      <h1>같이 풀고,<br />틀린 문제는 다시.</h1>
      <p>스터디원과 같은 문제집을 풀고, 내 학습 기록과 오답을 한곳에서 관리하세요.</p>
      <div className="row"><Link className="button-link large" href="/auth?mode=signup">무료로 시작하기</Link><Link className="text-link hero-login" href="/auth">이미 계정이 있어요</Link></div>
    </section>

    <section className="landing-features">{features.map(([title, description], index) => <article className="landing-feature" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{description}</p></article>)}</section>

    <section className="landing-cta"><div><span className="eyebrow">OUR QUIZ</span><h2>이번 주 공부, 문제만 준비되면 바로 시작할 수 있어요.</h2></div><Link className="button-link" href="/auth?mode=signup">스터디 시작하기</Link></section>
  </div>;
}
