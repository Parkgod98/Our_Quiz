import Link from "next/link";
import { notFound } from "next/navigation";
import { AttemptResultReview, type ResultQuestion } from "@/components/attempt-result-review";
import { logServerError } from "@/lib/server/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AttemptResult = {
  attemptId: string;
  versionId: string;
  groupId: string | null;
  title: string;
  version: number;
  score: number;
  total: number;
  submittedAt: string;
  questions: ResultQuestion[];
};

export default async function AttemptResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_attempt_result", { p_attempt_id: attemptId });

  if (error) {
    logServerError("attempts.result.load", error, { attemptId });
    if (error.message.includes("submitted attempt not found") || error.message.includes("authentication required")) notFound();
    return <section className="narrow panel"><h1>학습 결과를 불러오지 못했어요.</h1><p>오류가 기록됐어요. 잠시 후 다시 시도해 주세요.</p></section>;
  }
  if (!data) {
    logServerError("attempts.result.empty", new Error("attempt result RPC returned empty data"), { attemptId });
    return <section className="narrow panel"><h1>학습 결과를 불러오지 못했어요.</h1><p>오류가 기록됐어요. 잠시 후 다시 시도해 주세요.</p></section>;
  }

  const result = data as unknown as AttemptResult;
  const wrong = result.questions.filter((question) => question.correct === false);
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const question of result.questions) {
    const current = topicMap.get(question.topic) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (question.correct) current.correct += 1;
    topicMap.set(question.topic, current);
  }
  const topics = [...topicMap.entries()]
    .map(([topic, stats]) => ({ topic, ...stats, accuracy: Math.round((stats.correct / stats.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy);
  const retryHref = `/quiz/${result.versionId}${result.groupId ? `?groupId=${result.groupId}` : ""}`;

  return <section className="stack page-section result-page">
    <div className="result-hero">
      <span className="eyebrow">학습 결과</span>
      <h1>{result.title}</h1>
      <div className="result-score"><strong>{result.score}</strong><span>/ {result.total}</span></div>
      <p>{result.total}문제 중 {result.score}문제를 맞혔어요. · 정확도 {result.total ? Math.round((result.score / result.total) * 100) : 0}%</p>
      <div className="row"><Link className="button-link" href="/review">오답 복습하기</Link><Link className="button-link secondary" href={retryHref}>다시 풀기</Link></div>
    </div>

    <div className="metrics-grid"><article className="metric-card"><span>정답</span><strong>{result.score}</strong></article><article className="metric-card"><span>오답</span><strong>{wrong.length}</strong></article><article className="metric-card"><span>정확도</span><strong>{result.total ? Math.round((result.score / result.total) * 100) : 0}%</strong></article></div>

    <div className="panel stack"><h2>주제별 결과</h2>{topics.map((item) => <div className="topic-result-row" key={item.topic}><span>{item.topic}</span><div className="topic-progress"><i style={{ width: `${item.accuracy}%` }} /></div><strong>{item.accuracy}%</strong></div>)}</div>

    <AttemptResultReview questions={result.questions} />
  </section>;
}
