import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AttemptRow = { id: string; version_id: string; group_id: string | null; score: number | null; total: number; started_at: string; submitted_at: string | null; question_set_versions: { version_number: number; question_sets: { title: string } } };
type AnswerRow = { is_correct: boolean | null; questions: { topic: string } };
type MembershipRow = { group_id: string; study_groups: { name: string } };
type AssignmentRow = { group_id: string; version_id: string; assigned_at: string; version_number: number; question_count: number; title: string; subject: string; week_number: number };

function accuracy(correct: number, total: number) {
  return total === 0 ? "—" : `${Math.round((correct / total) * 100)}%`;
}

function topicLabel(topic: string) {
  return topic.replaceAll(".", " · ");
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <section className="narrow panel"><h1>서비스 연결을 확인해 주세요.</h1><p>학습 기록을 불러올 수 없어요.</p></section>;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <section className="narrow panel"><h1>로그인이 필요해요.</h1><Link className="button-link" href="/auth">로그인하기</Link></section>;

  const [attemptResult, answerResult, membershipResult, profileResult, assignmentsResult] = await Promise.all([
    supabase.from("attempts").select("id,version_id,group_id,score,total,started_at,submitted_at,question_set_versions!inner(version_number,question_sets!inner(title))").eq("user_id", userData.user.id).order("updated_at", { ascending: false }).limit(30),
    supabase.from("attempt_answers").select("is_correct,questions!inner(topic),attempts!inner(user_id)").eq("attempts.user_id", userData.user.id).not("is_correct", "is", null),
    supabase.from("group_members").select("group_id,study_groups!inner(name)").eq("user_id", userData.user.id),
    supabase.from("profiles").select("display_name").eq("id", userData.user.id).maybeSingle(),
    supabase.rpc("get_my_group_assignments"),
  ]);

  const attempts = (attemptResult.data ?? []) as unknown as AttemptRow[];
  const answers = (answerResult.data ?? []) as unknown as AnswerRow[];
  const memberships = (membershipResult.data ?? []) as unknown as MembershipRow[];
  const groupNameMap = new Map(memberships.map((membership) => [membership.group_id, membership.study_groups.name]));
  const assignments = ((assignmentsResult.data ?? []) as AssignmentRow[]).slice(0, 8);
  const completed = attempts.filter((attempt) => attempt.submitted_at);
  const inProgress = attempts.filter((attempt) => !attempt.submitted_at);
  const correct = answers.filter((answer) => answer.is_correct === true).length;
  const wrong = answers.filter((answer) => answer.is_correct === false).length;
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) {
    const current = topicMap.get(answer.questions.topic) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (answer.is_correct) current.correct += 1;
    topicMap.set(answer.questions.topic, current);
  }
  const weakTopics = [...topicMap.entries()].map(([topic, stats]) => ({ topic, ...stats, rate: stats.total ? stats.correct / stats.total : 1 })).sort((a, b) => a.rate - b.rate).slice(0, 5);
  const displayName = profileResult.data?.display_name?.trim() || userData.user.email?.split("@")[0] || "오늘";

  return <section className="stack page-section dashboard-page">
    <div className="dashboard-heading"><span className="eyebrow">오늘의 학습</span><h1>{displayName}님, 오늘도 이어서 해볼까요?</h1><p>진행 중인 문제와 최근 학습 기록을 한곳에서 확인하세요.</p></div>

    {inProgress.length > 0 && <div className="stack"><div className="section-heading"><h2>이어서 풀기</h2><p>답안은 마지막으로 저장한 곳부터 이어집니다.</p></div><div className="continue-grid">{inProgress.slice(0, 3).map((attempt) => <article className="continue-card" key={attempt.id}><div><span className="eyebrow">진행 중</span><h3>{attempt.question_set_versions.question_sets.title}</h3><p>{attempt.group_id ? groupNameMap.get(attempt.group_id) ?? "스터디" : "개인 학습"} · {attempt.total}문제</p></div><Link className="button-link" href={`/quiz/${attempt.version_id}${attempt.group_id ? `?groupId=${attempt.group_id}` : ""}`}>이어 풀기</Link></article>)}</div></div>}

    <div className="metrics-grid"><article className="metric-card"><span>누적 정확도</span><strong>{accuracy(correct, correct + wrong)}</strong></article><article className="metric-card"><span>복습할 오답</span><strong>{wrong}</strong><Link href="/review">오답노트 보기 →</Link></article><article className="metric-card"><span>완료한 풀이</span><strong>{completed.length}</strong></article></div>

    <div className="dashboard-columns">
      <div className="stack"><div className="section-heading"><h2>스터디 문제</h2><Link href="/groups">스터디 전체 보기</Link></div>{assignmentsResult.error ? <div className="empty-state compact"><p>스터디 문제를 불러오지 못했어요.</p></div> : assignments.length === 0 ? <div className="empty-state compact"><p>스터디에 추가된 문제집이 아직 없어요.</p><Link className="text-link" href="/groups">스터디 확인하기</Link></div> : assignments.map((assignment) => <article className="home-study-row" key={`${assignment.group_id}-${assignment.version_id}`}><div><small>{groupNameMap.get(assignment.group_id) ?? "스터디"}</small><strong>Week {assignment.week_number} · {assignment.title}</strong><span>{assignment.question_count}문제</span></div><Link href={`/quiz/${assignment.version_id}?groupId=${assignment.group_id}`}>풀기</Link></article>)}</div>

      <div className="stack"><div className="section-heading"><h2>다시 볼 주제</h2><Link href="/review">오답노트</Link></div><div className="panel stack">{weakTopics.length === 0 ? <p className="muted">문제를 풀면 취약한 주제를 알려드려요.</p> : weakTopics.map((item) => <div className="weak-topic-row" key={item.topic}><span>{topicLabel(item.topic)}</span><div className="topic-progress"><i style={{ width: `${Math.round(item.rate * 100)}%` }} /></div><strong>{accuracy(item.correct, item.total)}</strong></div>)}</div></div>
    </div>

    <div className="panel stack"><div className="section-heading"><h2>최근 학습</h2></div>{completed.length === 0 ? <p className="muted">완료한 풀이가 아직 없어요.</p> : completed.slice(0, 6).map((attempt) => <Link className="history-link" href={`/attempts/${attempt.id}`} key={attempt.id}><span><strong>{attempt.question_set_versions.question_sets.title}</strong><small>{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString("ko-KR") : ""}</small></span><strong>{attempt.score ?? 0} / {attempt.total}</strong></Link>)}</div>
  </section>;
}
