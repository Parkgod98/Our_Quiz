import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SetDetail = { id: string; title: string; subject: string; week_number: number; description: string | null; question_set_versions: Array<{ id: string; version_number: number; question_count: number; published_at: string }> };

export default async function LibraryDetailPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) notFound();
  const { data, error } = await supabase.from("question_sets").select("id,title,subject,week_number,description,question_set_versions(id,version_number,question_count,published_at)").eq("id", setId).eq("owner_id", userData.user.id).single();
  if (error || !data) notFound();
  const set = data as unknown as SetDetail;
  const versions = [...set.question_set_versions].sort((a, b) => b.version_number - a.version_number);

  return <section className="stack page-section">
    <Link className="back-link" href="/library">← 내 문제집</Link>
    <div className="library-detail-hero"><span className="week-chip">Week {set.week_number}</span><h1>{set.title}</h1><p>{set.description || set.subject}</p><div className="row"><Link className="button-link" href="/groups">스터디에 추가하기</Link><Link className="button-link secondary" href="/import">새 버전 추가</Link></div></div>
    <div className="panel stack"><h2>버전</h2>{versions.map((version, index) => <div className="version-row" key={version.id}><div><div className="row"><strong>버전 {version.version_number}</strong>{index === 0 && <span className="current-badge">최신</span>}</div><small>{version.question_count}문제 · {new Date(version.published_at).toLocaleDateString("ko-KR")}</small></div><div className="row"><Link className="button-link secondary" href={`/quiz/${version.id}`}>풀어보기</Link><a className="text-link" href={`/api/question-sets/export/${version.id}`}>JSON 내보내기</a></div></div>)}</div>
  </section>;
}
