import Link from "next/link";
import { ReviewPlayer, type ReviewItem } from "@/components/review-player";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ReviewPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <section className="narrow panel"><h1>로그인이 필요해요.</h1><Link className="button-link" href="/auth">로그인하기</Link></section>;
  const { data, error } = await supabase.rpc("get_review_items");
  const items = (!error && Array.isArray(data) ? data : []) as unknown as ReviewItem[];
  const repeated = items.filter((item) => item.wrongCount >= 2).length;
  const topicCount = new Set(items.map((item) => item.topic)).size;

  return <section className="stack page-section">
    <div className="page-heading"><span className="eyebrow">오답노트</span><h1>틀린 문제만 다시 보기</h1><p>한 번이라도 틀렸던 문제를 모아 다시 풀 수 있어요.</p></div>
    <div className="metrics-grid"><article className="metric-card"><span>복습할 문제</span><strong>{items.length}</strong></article><article className="metric-card"><span>반복 오답</span><strong>{repeated}</strong></article><article className="metric-card"><span>취약 주제</span><strong>{topicCount}</strong></article></div>
    {items.length === 0 ? <div className="empty-state"><h2>아직 복습할 문제가 없어요.</h2><p>문제를 풀고 틀린 항목이 생기면 자동으로 여기에 모입니다.</p><Link className="button-link" href="/groups">스터디 문제 풀기</Link></div> : <ReviewPlayer questions={items} />}
  </section>;
}
