import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SetRow = { id: string; title: string; subject: string; week_number: number; description: string | null; updated_at: string; question_set_versions: Array<{ id: string; version_number: number; question_count: number; published_at: string }> };

export default async function LibraryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <section className="narrow panel"><h1>로그인이 필요해요.</h1><Link className="button-link" href="/auth">로그인하기</Link></section>;
  const { data } = await supabase.from("question_sets").select("id,title,subject,week_number,description,updated_at,question_set_versions(id,version_number,question_count,published_at)").eq("owner_id", userData.user.id).order("week_number");
  const sets = (data ?? []) as unknown as SetRow[];

  return <section className="stack page-section">
    <div className="row spread page-heading"><div><span className="eyebrow">문제집</span><h1>내 문제집</h1><p>직접 추가한 문제집을 관리하고 스터디에 공유할 수 있어요.</p></div><Link className="button-link" href="/import">+ 문제집 추가</Link></div>
    {sets.length === 0 ? <div className="empty-state"><h2>아직 문제집이 없어요.</h2><p>JSON 문제 파일을 추가하면 여기에서 바로 관리할 수 있어요.</p><Link className="button-link" href="/import">첫 문제집 추가하기</Link></div> : <div className="library-grid">{sets.map((set) => {
      const latest = [...set.question_set_versions].sort((a, b) => b.version_number - a.version_number)[0];
      return <Link className="library-card" href={`/library/${set.id}`} key={set.id}><div className="row spread"><span className="week-chip">Week {set.week_number}</span><span aria-hidden>→</span></div><h2>{set.title}</h2><p>{set.description || set.subject}</p><div className="group-meta"><span>{latest?.question_count ?? 0}문제</span><span>버전 {latest?.version_number ?? 1}</span></div></Link>;
    })}</div>}
  </section>;
}
