import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SetRow = { id: string; title: string; subject: string; week_number: number; question_set_versions: Array<{ id: string; version_number: number; question_count: number; published_at: string }> };
type AttemptRow = { id: string; score: number | null; total: number; submitted_at: string | null; question_set_versions: { version_number: number; question_sets: { title: string } } };
type AnswerRow = { is_correct: boolean; questions: { topic: string } };

function accuracy(correct: number, total: number) {
  return total === 0 ? "—" : `${Math.round((correct / total) * 100)}%`;
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <section className="stack"><div><span className="eyebrow">DASHBOARD</span><h1>학습 기록</h1><p>Supabase 연결 후 실제 문제 세트, Attempt, Topic별 오답이 표시됩니다.</p></div><div className="panel"><Link className="button-link" href="/quiz/demo">Demo로 먼저 확인</Link></div></section>;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <section className="narrow panel"><h1>로그인이 필요합니다.</h1><Link className="button-link" href="/auth">로그인</Link></section>;

  const [setResult, attemptResult, answerResult] = await Promise.all([
    supabase.from("question_sets").select("id,title,subject,week_number,question_set_versions(id,version_number,question_count,published_at)").eq("owner_id", userData.user.id).order("week_number"),
    supabase.from("attempts").select("id,score,total,submitted_at,question_set_versions!inner(version_number,question_sets!inner(title))").eq("user_id", userData.user.id).order("submitted_at", { ascending: false }).limit(20),
    supabase.from("attempt_answers").select("is_correct,questions!inner(topic),attempts!inner(user_id)").eq("attempts.user_id", userData.user.id),
  ]);

  const sets = (setResult.data ?? []) as unknown as SetRow[];
  const attempts = (attemptResult.data ?? []) as unknown as AttemptRow[];
  const answers = (answerResult.data ?? []) as unknown as AnswerRow[];
  const correct = answers.filter((answer) => answer.is_correct).length;
  const wrong = answers.length - correct;
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) {
    const current = topicMap.get(answer.questions.topic) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (answer.is_correct) current.correct += 1;
    topicMap.set(answer.questions.topic, current);
  }
  const weakTopics = [...topicMap.entries()].map(([topic, stats]) => ({ topic, accuracy: stats.total ? stats.correct / stats.total : 1, ...stats })).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);

  return <section className="stack">
    <div><span className="eyebrow">DASHBOARD</span><h1>학습 기록</h1><p>Question Set Version과 Attempt를 기준으로 학습 이력을 누적합니다.</p></div>
    <div className="metrics-grid"><article className="metric-card"><span>누적 정확도</span><strong>{accuracy(correct, answers.length)}</strong></article><article className="metric-card"><span>누적 오답</span><strong>{wrong}</strong></article><article className="metric-card"><span>완료 Attempt</span><strong>{attempts.length}</strong></article></div>

    <div className="panel stack"><div className="row spread"><h2>내 문제 세트</h2><Link className="button-link secondary" href="/import">Import</Link></div>{sets.length === 0 ? <p className="muted">아직 Import한 문제 세트가 없습니다.</p> : sets.map((set) => <div key={set.id} className="list-row"><span><strong>Week {set.week_number} · {set.title}</strong><small>{set.subject}</small></span><span className="row">{set.question_set_versions.map((version) => <span className="row" key={version.id}><Link className="button-link secondary" href={`/quiz/${version.id}`}>v{version.version_number} Start</Link><a className="text-link" href={`/api/question-sets/export/${version.id}`}>Export</a></span>)}</span></div>)}</div>

    <div className="feature-grid">
      <div className="panel stack"><h2>최근 Attempt</h2>{attempts.length === 0 ? <p className="muted">아직 풀이 기록이 없습니다.</p> : attempts.slice(0, 8).map((attempt) => <div className="list-row" key={attempt.id}><span><strong>{attempt.question_set_versions.question_sets.title} v{attempt.question_set_versions.version_number}</strong><small>{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString("ko-KR") : "진행 중"}</small></span><strong>{attempt.score ?? 0} / {attempt.total}</strong></div>)}</div>
      <div className="panel stack"><h2>취약 Topic</h2>{weakTopics.length === 0 ? <p className="muted">문제를 풀면 Topic별 통계가 생깁니다.</p> : weakTopics.map((item) => <div className="list-row" key={item.topic}><span>{item.topic}</span><strong>{accuracy(item.correct, item.total)}</strong></div>)}</div>
    </div>
  </section>;
}
