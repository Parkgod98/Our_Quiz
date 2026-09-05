"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayableQuestion, PlayableQuestionSet, PortableQuestionSet } from "@/lib/questions/types";
import { evaluateAnswer } from "@/lib/questions/scoring";

type Feedback = { correct: boolean; explanation?: string };
type FeedbackMap = Record<string, Feedback>;
type StartPayload = { attemptId?: string; responses?: Record<string, unknown>; flaggedQuestionIds?: string[]; error?: string };

function isAnswered(question: PlayableQuestion, value: unknown) {
  if (question.type === "true_false") return typeof value === "boolean";
  if (question.type === "single_choice") return typeof value === "string" && value.length > 0;
  if (question.type === "multiple_choice" || question.type === "ordering") return Array.isArray(value) && value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function ChoiceList({ question, value, onChange }: { question: Extract<PlayableQuestion, { type: "single_choice" | "multiple_choice" }>; value: unknown; onChange: (value: unknown) => void }) {
  const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return <div className="choices">{question.choices.map((choice) => <label className="choice" key={choice.id}><input type={question.type === "single_choice" ? "radio" : "checkbox"} name={question.id} checked={question.type === "single_choice" ? value === choice.id : selected.includes(choice.id)} onChange={() => question.type === "single_choice" ? onChange(choice.id) : onChange(selected.includes(choice.id) ? selected.filter((id) => id !== choice.id) : [...selected, choice.id])} /><span>{choice.text}</span></label>)}</div>;
}

export function QuizPlayer({ questionSet, versionId, groupId, demoAnswerSet }: { questionSet: PlayableQuestionSet; versionId?: string; groupId?: string; demoAnswerSet?: PortableQuestionSet }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [attemptId, setAttemptId] = useState<string | null>(demoAnswerSet ? "demo" : null);
  const [feedback, setFeedback] = useState<FeedbackMap | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [sessionError, setSessionError] = useState("");
  const [showSubmitReview, setShowSubmitReview] = useState(false);
  const question = questionSet.questions[index];
  const response = responses[question.id];

  useEffect(() => {
    if (!versionId || demoAnswerSet) return;
    let active = true;
    void fetch("/api/attempts/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId, groupId }),
    }).then(async (result) => {
      const payload = (await result.json()) as StartPayload;
      if (!active) return;
      if (!result.ok || !payload.attemptId) {
        setSessionError(payload.error ?? "풀이를 시작하지 못했어요.");
        return;
      }
      setAttemptId(payload.attemptId);
      setResponses(payload.responses ?? {});
      setFlagged(new Set(payload.flaggedQuestionIds ?? []));
      setSaveState("saved");
    });
    return () => { active = false; };
  }, [versionId, groupId, demoAnswerSet]);

  const answeredCount = useMemo(() => questionSet.questions.filter((item) => isAnswered(item, responses[item.id])).length, [questionSet.questions, responses]);
  const unansweredIndexes = useMemo(() => questionSet.questions.map((item, itemIndex) => isAnswered(item, responses[item.id]) ? -1 : itemIndex).filter((itemIndex) => itemIndex >= 0), [questionSet.questions, responses]);
  const progress = Math.round((answeredCount / questionSet.questions.length) * 100);

  async function persistResponse(questionId: string, value: unknown) {
    if (!attemptId || attemptId === "demo") return;
    setSaveState("saving");
    const result = await fetch(`/api/attempts/${attemptId}/response`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, response: value }),
    });
    setSaveState(result.ok ? "saved" : "error");
  }

  function setResponse(value: unknown) {
    setResponses((current) => ({ ...current, [question.id]: value }));
    void persistResponse(question.id, value);
  }

  function moveOrdering(itemId: string, direction: -1 | 1) {
    if (question.type !== "ordering") return;
    const current = Array.isArray(responses[question.id]) ? (responses[question.id] as string[]) : question.items.map((item) => item.id);
    const from = current.indexOf(itemId);
    const to = from + direction;
    if (to < 0 || to >= current.length) return;
    const next = [...current];
    [next[from], next[to]] = [next[to], next[from]];
    setResponse(next);
  }

  async function toggleFlag() {
    const next = !flagged.has(question.id);
    setFlagged((current) => {
      const copy = new Set(current);
      if (next) copy.add(question.id); else copy.delete(question.id);
      return copy;
    });
    if (!attemptId || attemptId === "demo") return;
    await fetch(`/api/attempts/${attemptId}/flag`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: question.id, flagged: next }) });
  }

  async function submit() {
    setPending(true);
    setShowSubmitReview(false);
    if (demoAnswerSet) {
      const nextFeedback: FeedbackMap = {};
      let total = 0;
      for (const item of demoAnswerSet.questions) {
        const correct = evaluateAnswer(item, responses[item.id]);
        nextFeedback[item.id] = { correct, explanation: item.explanation };
        if (correct) total += 1;
      }
      setFeedback(nextFeedback);
      setScore(total);
      setPending(false);
      return;
    }

    if (!attemptId) {
      setSessionError("풀이 정보를 불러오지 못했어요. 페이지를 새로고침해 주세요.");
      setPending(false);
      return;
    }

    const apiResponse = await fetch(`/api/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
    });
    const payload = (await apiResponse.json()) as { attemptId?: string; score?: number; results?: Array<{ questionId: string; correct: boolean; explanation: string }>; error?: string };
    if (apiResponse.ok && payload.attemptId) {
      router.push(`/attempts/${payload.attemptId}`);
      router.refresh();
      return;
    }
    setSessionError(payload.error ?? "제출하지 못했어요.");
    setPending(false);
  }

  const ordering = question.type === "ordering" ? (Array.isArray(response) ? (response as string[]) : question.items.map((item) => item.id)) : [];
  const currentFeedback = feedback?.[question.id];

  if (!attemptId && versionId && !sessionError) return <div className="panel loading-state"><strong>문제를 준비하고 있어요.</strong><p>잠시만 기다려 주세요.</p></div>;
  if (sessionError && !attemptId) return <div className="panel error-box"><strong>문제를 열지 못했어요.</strong><p>{sessionError}</p></div>;

  return <div className="quiz-layout">
    <div className="quiz-main">
      <div className="quiz-topline"><span>{questionSet.title}</span><span>{answeredCount} / {questionSet.questions.length} 완료</span></div>
      <div className="progress"><span style={{ width: `${progress}%` }} /></div>
      <article className="question-card">
        <div className="row spread"><div className="row"><span className="question-number">Q{index + 1}</span><span className="topic-label">{question.topic}</span></div><button className={flagged.has(question.id) ? "bookmark-button active" : "bookmark-button"} onClick={() => void toggleFlag()}>{flagged.has(question.id) ? "★ 다시 볼 문제" : "☆ 다시 볼 문제"}</button></div>
        <h2>{question.prompt}</h2>
        {(question.type === "single_choice" || question.type === "multiple_choice") && <ChoiceList question={question} value={response} onChange={setResponse} />}
        {question.type === "true_false" && <div className="true-false-grid"><button className={response === true ? "selected" : "secondary"} onClick={() => setResponse(true)}>O</button><button className={response === false ? "selected" : "secondary"} onClick={() => setResponse(false)}>X</button></div>}
        {question.type === "short_answer" && <input className="answer-input" value={typeof response === "string" ? response : ""} onChange={(event) => setResponse(event.target.value)} onBlur={(event) => { if (event.target.value.trim()) void persistResponse(question.id, event.target.value); }} placeholder="정답을 입력하세요" />}
        {question.type === "ordering" && <div className="stack"><div className="ordering-list">{ordering.map((itemId, orderIndex) => { const item = question.items.find((candidate) => candidate.id === itemId); return <div className="ordering-item" key={itemId}><strong>{orderIndex + 1}. {item?.text}</strong><span><button className="icon-button" aria-label="위로" onClick={() => moveOrdering(itemId, -1)}>↑</button><button className="icon-button" aria-label="아래로" onClick={() => moveOrdering(itemId, 1)}>↓</button></span></div>; })}</div>{!Array.isArray(response) && <button className="secondary" onClick={() => setResponse(ordering)}>이 순서로 선택</button>}</div>}
        {currentFeedback && <div className={currentFeedback.correct ? "feedback success-box" : "feedback error-box"}><strong>{currentFeedback.correct ? "정답" : "오답"}</strong>{currentFeedback.explanation && <p>{currentFeedback.explanation}</p>}</div>}
      </article>
      <div className="quiz-footer"><button className="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>이전</button><span className={`save-indicator ${saveState}`}>{saveState === "saving" ? "저장 중..." : saveState === "error" ? "저장 실패" : attemptId === "demo" ? "" : "자동 저장됨"}</span>{index < questionSet.questions.length - 1 ? <button onClick={() => setIndex((value) => value + 1)}>다음</button> : <button disabled={pending || feedback !== null} onClick={() => unansweredIndexes.length > 0 && !demoAnswerSet ? setShowSubmitReview(true) : void submit()}>{pending ? "제출 중..." : "제출하기"}</button>}</div>
      {showSubmitReview && <div className="submit-review panel"><h3>아직 {unansweredIndexes.length}문제를 풀지 않았어요.</h3><p>답하지 않은 문제도 오답으로 처리됩니다.</p><div className="row"><button className="secondary" onClick={() => { setIndex(unansweredIndexes[0] ?? 0); setShowSubmitReview(false); }}>계속 풀기</button><button onClick={() => void submit()}>그대로 제출</button></div></div>}
      {sessionError && <p className="notice error-text">{sessionError}</p>}
      {score !== null && <div className="score-card"><span>결과</span><strong>{score} / {questionSet.questions.length}</strong></div>}
    </div>

    <aside className="question-navigator" aria-label="문제 목록">
      <div className="row spread"><strong>문제 목록</strong><span>{progress}%</span></div>
      <div className="question-number-grid">{questionSet.questions.map((item, itemIndex) => {
        const answered = isAnswered(item, responses[item.id]);
        const isFlagged = flagged.has(item.id);
        const className = ["question-index", answered ? "answered" : "", isFlagged ? "flagged" : "", itemIndex === index ? "current" : ""].filter(Boolean).join(" ");
        return <button className={className} key={item.id} onClick={() => setIndex(itemIndex)} aria-label={`${itemIndex + 1}번 문제${answered ? ", 답변 완료" : ", 미답변"}${isFlagged ? ", 다시 볼 문제" : ""}`}>{itemIndex + 1}</button>;
      })}</div>
      <div className="navigator-legend"><span><i className="legend-dot answered" />답변 완료</span><span><i className="legend-dot flagged" />다시 볼 문제</span></div>
    </aside>
  </div>;
}
