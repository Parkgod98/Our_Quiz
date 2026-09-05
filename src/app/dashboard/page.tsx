import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function DashboardPage() {
  const configured = isSupabaseConfigured();
  return (
    <section className="stack">
      <div><span className="eyebrow">DASHBOARD</span><h1>학습 기록</h1><p>{configured ? "Supabase가 연결되어 있습니다. 로그인 후 개인 문제은행과 Attempt를 불러옵니다." : "현재는 Supabase 연결 전입니다. 연결 후 실제 사용자 기록이 표시됩니다."}</p></div>
      <div className="metrics-grid">
        <article className="metric-card"><span>이번 주 정확도</span><strong>—</strong></article>
        <article className="metric-card"><span>반복 오답</span><strong>—</strong></article>
        <article className="metric-card"><span>완료 Attempt</span><strong>—</strong></article>
      </div>
      <div className="panel"><h2>첫 흐름 확인</h2><p>Supabase 연결 전에도 문제 Player와 Import Validator는 확인할 수 있습니다.</p><div className="row"><Link className="button-link" href="/quiz/demo">Demo</Link><Link className="button-link secondary" href="/import">Import</Link></div></div>
    </section>
  );
}
