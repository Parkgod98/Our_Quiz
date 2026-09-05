"use client";

import { useMemo, useState } from "react";
import type { PortableQuestion, PortableQuestionSet } from "@/lib/questions/types";
import { evaluateAnswer } from "@/lib/questions/scoring";

type ResultMap = Record<string, boolean>;

function ChoiceList({ question, value, onChange }: { question: Extract<PortableQuestion, { type: "single_choice" | "multiple_choice" }>; value: unknown; onChange: (value: unknown) => void }) {
  const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return (
    <div className="choices">
      {question.choices.map((choice) => (
        <label className="choice" key={choice.id}>
          <input
            type={question.type === "single_choice" ? "radio" : "checkbox"}
            name={question.id}
            checked={question.type === "single_choice" ? value === choice.id : selected.includes(choice.id)}
            onChange={() => {
              if (question.type === "single_choice") onChange(choice.id);
              else onChange(selected.includes(choice.id) ? selected.filter((id) => id !== choice.id) : [...selected, choice.id]);
            }}
          />
          <span>{choice.text}</span>
        </label>
      ))}
    </div>
  );
}

export function QuizPlayer({ questionSet, versionId }: { questionSet: PortableQuestionSet; versionId?: string }) {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [results, setResults] = useState<ResultMap | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const question = questionSet.questions[index];
  const progress = Math.round(((index + 1) / questionSet.questions.length) * 100);

  const answeredCount = useMemo(() => Object.keys(responses).length, [responses]);

  function setResponse(value: unknown) {
    setResponses((current) => ({ ...current, [question.id]: value }));
  }

  function moveOrdering(itemId: string, direction: -1 | 1) {
    if (question.type !== "ordering") return;
    const current = Array.isArray(responses[question.id])
      ? (responses[question.id] as string[])
      : question.items.map((item) => item.id);
    const from = current.indexOf(itemId);
    const to = from + direction;
    if (to < 0 || to >= current.length) return;
    const next = [...current];
    [next[from], next[to]] = [next[to], next[from]];
    setResponse(next);
  }

  async function submit() {
    setPending(true);
    if (!versionId) {
      const localResults: ResultMap = {};
      let total = 0;
      for (const item of questionSet.questions) {
        const correct = evaluateAnswer(item, responses[item.id]);
        localResults[item.id] = correct;
        if (correct) total += 1;
      }
      setResults(localResults);
      setScore(total);
      setPending(false);
      return;
    }

    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId, responses }),
    });
    const payload = (await response.json()) as { score?: number; results?: Array<{ questionId: string; correct: boolean }>; error?: string };
    if (response.ok && payload.results) {
      setScore(payload.score ?? 0);
      setResults(Object.fromEntries(payload.results.map((item) => [item.questionId, item.correct])));
    }
    setPending(false);
  }

  const response = responses[question.id];
  const ordering = question.type === "ordering"
    ? (Array.isArray(response) ? (response as string[]) : question.items.map((item) => item.id))
    : [];

  return (
    <div className="quiz-shell">
      <div className="quiz-topline"><span>{questionSet.title}</span><span>{index + 1} / {questionSet.questions.length}</span></div>
      <div className="progress"><span style={{ width: `${progress}%` }} /></div>

      <article className="question-card">
        <div className="row spread"><span className="eyebrow">{question.topic}</span><span>난이도 {question.difficulty}</span></div>
        <h2>{question.prompt}</h2>

        {(question.type === "single_choice" || question.type === "multiple_choice") && <ChoiceList question={question} value={response} onChange={setResponse} />}
        {question.type === "true_false" && (
          <div className="row"><button className={response === true ? "selected" : "secondary"} onClick={() => setResponse(true)}>O</button><button className={response === false ? "selected" : "secondary"} onClick={() => setResponse(false)}>X</button></div>
        )}
        {question.type === "short_answer" && <input className="answer-input" value={typeof response === "string" ? response : ""} onChange={(event) => setResponse(event.target.value)} placeholder="정답 입력" />}
        {question.type === "ordering" && (
          <div className="ordering-list">
            {ordering.map((itemId, orderIndex) => {
              const item = question.items.find((candidate) => candidate.id === itemId);
              return <div className="ordering-item" key={itemId}><strong>{orderIndex + 1}. {item?.text}</strong><span><button className="icon-button" aria-label="위로" onClick={() => moveOrdering(itemId, -1)}>↑</button><button className="icon-button" aria-label="아래로" onClick={() => moveOrdering(itemId, 1)}>↓</button></span></div>;
            })}
          </div>
        )}

        {results && (
          <div className={results[question.id] ? "feedback success-box" : "feedback error-box"}>
            <strong>{results[question.id] ? "정답" : "오답"}</strong>
            {!versionId && <p>{question.explanation}</p>}
          </div>
        )}
      </article>

      <div className="row spread">
        <button className="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>이전</button>
        <span className="muted">{answeredCount}문제 응답</span>
        {index < questionSet.questions.length - 1
          ? <button onClick={() => setIndex((value) => value + 1)}>다음</button>
          : <button disabled={pending || results !== null} onClick={submit}>{pending ? "채점 중..." : "제출"}</button>}
      </div>

      {score !== null && <div className="score-card"><span>Score</span><strong>{score} / {questionSet.questions.length}</strong><p>틀린 문제는 결과 화면과 Dashboard에서 다시 모아볼 수 있도록 저장됩니다.</p></div>}
    </div>
  );
}
