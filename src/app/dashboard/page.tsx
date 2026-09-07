import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logServerError } from "@/lib/server/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AttemptRow = {
  id: string;
  versionId: string;
  groupId: string | null;
  groupName: string | null;
  score: number | null;
  total: number;
  startedAt: string;
  submittedAt: string | null;
  title: string;
  versionNumber: number;
};

type AssignmentRow = {
  groupId: string;
  groupName: string;
  versionId: string;
  assignedAt: string;
  versionNumber: number;
  questionCount: number;
  title: string;
  subject: string;
  weekNumber: number;
};

type WeakTopicRow = { topic: string; correct: number; total: number };
type DashboardOverview = {
  displayName: string;
  attempts: AttemptRow[];
  assignments: AssignmentRow[];
  correct: number;
  wrong: number;
  weakTopics: WeakTopicRow[];
};

function accuracy(correct: number, total: number) {
  return total === 0 ? "—" : `${Math.round((correct / total) * 100)}%`;
}

function topicLabel(topic: string) {
  return topic.replaceAll(".", " · ");
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <section className="narrow panel"><h1>서비스 연결을 확인해 주세요.</h1><p>학습 기록을 불러올 수 없어요.</p></section>;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_dashboard_overview");

  if (!data && !error) return <section className="narrow panel"><h1>로그인이 필요해요.</h1><Link className="button-link" href="/auth">로그인하기</Link></section>;
  if (error) {
    logServerError("dashboard.load", error);
    return <section className="narrow panel"><h1>학습 기록을 불러오지 못했어요.</h1><p>오류가 기록됐어요. 잠시 후 다시 시도해 주세요.</p></section>;
  }
  if (!data) {
    logServerError("dashboard.empty", new Error("dashboard RPC returned empty data"));
    return <section className="narrow panel"><h1>학습 기록을 불러오지 못했어요.</h1><p>오류가 기록됐어요. 잠시 후 다시 시도해 주세요.</p></section>;
  }

  const overview = data as unknown as DashboardOverview;
  const attempts = overview.attempts ?? [];
  const assignments = overview.assignments ?? [];
  const weakTopics = overview.weakTopics ?? [];
  const completed = attempts.filter((attempt) => attempt.submittedAt);
  const inProgress = attempts.filter((attempt) => !attempt.submittedAt);
  const correct = overview.correct ?? 0;
  const wrong = overview.wrong ?? 0;

  return <section className="stack page-section dashboard-page">
    <div className="dashboard-heading"><span className="eyebrow">오늘의 학습</span><h1>{overview.displayName}님, 오늘도 이어서 해볼까요?</h1><p>진행 중인 문제와 최근 학습 기록을 한곳에서 확인하세요.</p></div>

    {inProgress.length > 0 && <div className="stack"><div className="section-heading"><h2>이어서 풀기</h2><p>답안은 마지막으로 저장한 곳부터 이어집니다.</p></div><div className="continue-grid">{inProgress.slice(0, 3).map((attempt) => <article className="continue-card" key={attempt.id}><div><span className="eyebrow">진행 중</span><h3>{attempt.title}</h3><p>{attempt.groupName ?? "개인 학습"} · {attempt.total}문제</p></div><Link className="button-link" href={`/quiz/${attempt.versionId}${attempt.groupId ? `?groupId=${attempt.groupId}` : ""}`}>이어 풀기</Link></article>)}</div></div>}

    <div className="metrics-grid"><article className="metric-card"><span>누적 정확도</span><strong>{accuracy(correct, correct + wrong)}</strong></article><article className="metric-card"><span>복습할 오답</span><strong>{wrong}</strong><Link href="/review">오답노트 보기 →</Link></article><article className="metric-card"><span>완료한 풀이</span><strong>{completed.length}</strong></article></div>

    <div className="dashboard-columns">
      <div className="stack"><div className="section-heading"><h2>스터디 문제</h2><Link href="/groups">스터디 전체 보기</Link></div>{assignments.length === 0 ? <div className="empty-state compact"><p>스터디에 추가된 문제집이 아직 없어요.</p><Link className="text-link" href="/groups">스터디 확인하기</Link></div> : assignments.map((assignment) => <article className="home-study-row" key={`${assignment.groupId}-${assignment.versionId}`}><div><small>{assignment.groupName}</small><strong>Week {assignment.weekNumber} · {assignment.title}</strong><span>{assignment.questionCount}문제</span></div><Link href={`/quiz/${assignment.versionId}?groupId=${assignment.groupId}`}>풀기</Link></article>)}</div>

      <div className="stack"><div className="section-heading"><h2>다시 볼 주제</h2><Link href="/review">오답노트</Link></div><div className="panel stack">{weakTopics.length === 0 ? <p className="muted">문제를 풀면 취약한 주제를 알려드려요.</p> : weakTopics.map((item) => <div className="weak-topic-row" key={item.topic}><span>{topicLabel(item.topic)}</span><div className="topic-progress"><i style={{ width: `${Math.round((item.total ? item.correct / item.total : 1) * 100)}%` }} /></div><strong>{accuracy(item.correct, item.total)}</strong></div>)}</div></div>
    </div>

    <div className="panel stack"><div className="section-heading"><h2>최근 학습</h2></div>{completed.length === 0 ? <p className="muted">완료한 풀이가 아직 없어요.</p> : completed.slice(0, 6).map((attempt) => <Link className="history-link" href={`/attempts/${attempt.id}`} key={attempt.id}><span><strong>{attempt.title}</strong><small>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString("ko-KR") : ""}</small></span><strong>{attempt.score ?? 0} / {attempt.total}</strong></Link>)}</div>
  </section>;
}
