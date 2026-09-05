import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Choice } from "@/lib/questions/types";

type ResultQuestion = { id: string; topic: string; difficulty: number; prompt: string; choices: Choice[] | null; items: Choice[] | null; submittedAnswer: unknown; correct: boolean | null; answer: unknown; explanation: string };
type AttemptResult = { attemptId: string; versionId: string; groupId: string | null; title: string; version: number; score: number; total: number; submittedAt: string; questions: ResultQuestion[] };

function answerText(value: unknown, question: ResultQuestion) {
  if (value === null || value === undefined) return "미응답";
  const lookup = new Map([...(question.choices ?? []), ...(question.items ?? [])].map((item) => [item.id, item.text]));
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? lookup.get(item) ?? item : String(item)).join(" → ");
  if (typeof value === "boolean") return value ? "O" : "X";
  if (typeof value === "string") return lookup.get(value) ?? value;
  return String(value);
}

export default async function AttemptResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) notFound();
  const { data, error } = await supabase.rpc("get_attempt_result", { p_attempt_id: attemptId });
  if (error || !data) notFound();
  const result = data as unknown as AttemptResult;
  const wrong = result.questions.filter((question) => question.correct === false);
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const question of result.questions) {
    const current = topicMap.get(question.topic) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (question.correct) current.correct += 1;
    topicMap.set(question.topic, current);
  }
  const topics = [...topicMap.entries()].map(([topic, stats]) => ({ topic, ...stats, accuracy: Math.round((stats.correct / stats.total) * 100) })).sort((a, b) => a.accuracy - b.accuracy);
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

    <div className="stack"><div className="section-heading"><h2>문제별 풀이</h2><p>{wrong.length}문제를 다시 확인해 보세요.</p></div>{result.questions.map((question, index) => <article className={`result-question ${question.correct ? "correct" : "wrong"}`} key={question.id}><div className="row spread"><span className="question-number">Q{index + 1}</span><strong>{question.correct ? "정답" : "오답"}</strong></div><h3>{question.prompt}</h3><dl className="answer-review"><div><dt>내 답</dt><dd>{answerText(question.submittedAnswer, question)}</dd></div>{!question.correct && <div><dt>정답</dt><dd>{answerText(question.answer, question)}</dd></div>}</dl><div className="explanation"><strong>해설</strong><p>{question.explanation}</p></div></article>)}</div>
  </section>;
}
