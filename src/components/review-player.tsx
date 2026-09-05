"use client";

import { useMemo, useState } from "react";
import type { Choice, QuestionType } from "@/lib/questions/types";

export type ReviewItem = { questionId: string; questionKey: string; versionId: string; type: QuestionType; topic: string; difficulty: number; prompt: string; choices: Choice[] | null; items: Choice[] | null; wrongCount: number; attemptCount: number; lastWrongAt: string };
type Feedback = { correct: boolean; explanation: string };

export function ReviewPlayer({ questions }: { questions: ReviewItem[] }) {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const question = questions[index];
  const response = responses[question.questionId];
  const answered = useMemo(() => Object.keys(responses).length, [responses]);

  function setResponse(value: unknown) {
    setResponses((current) => ({ ...current, [question.questionId]: value }));
  }

  function moveOrdering(itemId: string, direction: -1 | 1) {
    if (question.type !== "ordering") return;
    const items = question.items ?? [];
    const current = Array.isArray(response) ? (response as string[]) : items.map((item) => item.id);
    const from = current.indexOf(itemId);
    const to = from + direction;
    if (to < 0 || to >= current.length) return;
    const next = [...current];
    [next[from], next[to]] = [next[to], next[from]];
    setResponse(next);
  }

  async function grade() {
    setPending(true);
    setMessage("");
    const result = await fetch("/api/review/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ responses }) });
    const payload = (await result.json()) as { results?: Array<{ questionId: string; correct: boolean; explanation: string }>; error?: string };
    setPending(false);
    if (!result.ok || !payload.results) return setMessage(payload.error ?? "채점하지 못했어요.");
    setFeedback(Object.fromEntries(payload.results.map((item) => [item.questionId, { correct: item.correct, explanation: item.explanation }])));
  }

  const currentFeedback = feedback[question.questionId];
  const choices = question.choices ?? [];
  const items = question.items ?? [];
  const selected = Array.isArray(response) ? response.filter((item): item is string => typeof item === "string") : [];
  const ordering = question.type === "ordering" ? (Array.isArray(response) ? response as string[] : items.map((item) => item.id)) : [];

  return <div className="quiz-layout review-session">
    <div className="quiz-main">
      <div className="quiz-topline"><span>오답 복습</span><span>{index + 1} / {questions.length}</span></div>
      <article className="question-card">
        <div className="row spread"><div className="row"><span className="question-number">Q{index + 1}</span><span className="topic-label">{question.topic}</span></div><span className="wrong-count">{question.wrongCount}번 틀린 문제</span></div>
        <h2>{question.prompt}</h2>
        {(question.type === "single_choice" || question.type === "multiple_choice") && <div className="choices">{choices.map((choice) => <label className="choice" key={choice.id}><input type={question.type === "single_choice" ? "radio" : "checkbox"} name={question.questionId} checked={question.type === "single_choice" ? response === choice.id : selected.includes(choice.id)} onChange={() => question.type === "single_choice" ? setResponse(choice.id) : setResponse(selected.includes(choice.id) ? selected.filter((id) => id !== choice.id) : [...selected, choice.id])} /><span>{choice.text}</span></label>)}</div>}
        {question.type === "true_false" && <div className="true-false-grid"><button className={response === true ? "selected" : "secondary"} onClick={() => setResponse(true)}>O</button><button className={response === false ? "selected" : "secondary"} onClick={() => setResponse(false)}>X</button></div>}
        {question.type === "short_answer" && <input className="answer-input" value={typeof response === "string" ? response : ""} onChange={(event) => setResponse(event.target.value)} placeholder="정답을 입력하세요" />}
        {question.type === "ordering" && <div className="stack"><div className="ordering-list">{ordering.map((itemId, orderIndex) => { const item = items.find((candidate) => candidate.id === itemId); return <div className="ordering-item" key={itemId}><strong>{orderIndex + 1}. {item?.text}</strong><span><button className="icon-button" onClick={() => moveOrdering(itemId, -1)} aria-label="위로">↑</button><button className="icon-button" onClick={() => moveOrdering(itemId, 1)} aria-label="아래로">↓</button></span></div>; })}</div>{!Array.isArray(response) && <button className="secondary" onClick={() => setResponse(ordering)}>이 순서로 선택</button>}</div>}
        {currentFeedback && <div className={currentFeedback.correct ? "feedback success-box" : "feedback error-box"}><strong>{currentFeedback.correct ? "이번엔 맞혔어요." : "다시 확인해 보세요."}</strong><p>{currentFeedback.explanation}</p></div>}
      </article>
      <div className="quiz-footer"><button className="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>이전</button><span className="muted">{answered}문제 답변</span>{index < questions.length - 1 ? <button onClick={() => setIndex((value) => value + 1)}>다음</button> : <button disabled={pending || answered === 0} onClick={() => void grade()}>{pending ? "채점 중..." : "복습 채점하기"}</button>}</div>
      {message && <p className="notice error-text">{message}</p>}
    </div>
    <aside className="question-navigator"><strong>오답 목록</strong><div className="question-number-grid">{questions.map((item, itemIndex) => <button key={item.questionId} className={["question-index", responses[item.questionId] !== undefined ? "answered" : "", itemIndex === index ? "current" : ""].filter(Boolean).join(" ")} onClick={() => setIndex(itemIndex)}>{itemIndex + 1}</button>)}</div></aside>
  </div>;
}
