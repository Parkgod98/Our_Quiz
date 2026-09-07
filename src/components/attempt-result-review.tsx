"use client";

import { useState } from "react";
import type { Choice, QuestionType } from "@/lib/questions/types";
import styles from "./attempt-result-review.module.css";

export type ResultQuestion = {
  id: string;
  type: QuestionType;
  topic: string;
  difficulty: number;
  prompt: string;
  choices: Choice[] | null;
  items: Choice[] | null;
  submittedAnswer: unknown;
  correct: boolean | null;
  answer: unknown;
  explanation: string;
};

type Filter = "wrong" | "all";

function idSet(value: unknown) {
  if (Array.isArray(value)) return new Set(value.filter((item): item is string => typeof item === "string"));
  if (typeof value === "string") return new Set([value]);
  return new Set<string>();
}

function answerText(value: unknown, question: ResultQuestion) {
  if (value === null || value === undefined) return "미응답";
  const lookup = new Map([...(question.choices ?? []), ...(question.items ?? [])].map((item) => [item.id, item.text]));
  if (Array.isArray(value)) {
    const separator = question.type === "ordering" ? " → " : ", ";
    return value.map((item) => typeof item === "string" ? lookup.get(item) ?? item : String(item)).join(separator);
  }
  if (typeof value === "boolean") return value ? "O" : "X";
  if (typeof value === "string") return lookup.get(value) ?? value;
  return String(value);
}

function ChoiceComparison({ question }: { question: ResultQuestion }) {
  const choices = question.choices ?? [];
  const selected = idSet(question.submittedAnswer);
  const correct = idSet(question.answer);

  return <div className={styles.choiceList}>
    {choices.map((choice) => {
      const isSelected = selected.has(choice.id);
      const isCorrect = correct.has(choice.id);
      const stateClass = isCorrect
        ? styles.choiceCorrect
        : isSelected
          ? styles.choiceWrong
          : styles.choiceNeutral;
      const badge = isCorrect && isSelected
        ? "내 답 · 정답"
        : isCorrect
          ? "정답"
          : isSelected
            ? "내 답 · 오답"
            : null;

      return <div className={`${styles.choiceRow} ${stateClass}`} key={choice.id}>
        <span className={styles.choiceText}>{choice.text}</span>
        {badge && <span className={isCorrect ? styles.correctBadge : styles.wrongBadge}>{badge}</span>}
      </div>;
    })}
    {choices.length === 0 && <p className="muted">선지 정보를 불러오지 못했어요.</p>}
  </div>;
}

function AnswerComparison({ question }: { question: ResultQuestion }) {
  if (question.type === "single_choice" || question.type === "multiple_choice") {
    return <ChoiceComparison question={question} />;
  }

  const isCorrect = question.correct === true;
  return <div className={styles.answerGrid}>
    <div className={`${styles.answerBox} ${isCorrect ? styles.answerOk : styles.answerBad}`}>
      <span>내 답</span>
      <strong>{answerText(question.submittedAnswer, question)}</strong>
    </div>
    {!isCorrect && <div className={`${styles.answerBox} ${styles.answerCorrect}`}>
      <span>정답</span>
      <strong>{answerText(question.answer, question)}</strong>
    </div>}
  </div>;
}

export function AttemptResultReview({ questions }: { questions: ResultQuestion[] }) {
  const wrongCount = questions.filter((question) => question.correct === false).length;
  const [filter, setFilter] = useState<Filter>(wrongCount > 0 ? "wrong" : "all");
  const visible = questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => filter === "all" || question.correct === false);

  return <div className="stack">
    <div className={styles.reviewHeading}>
      <div>
        <h2>문제별 풀이</h2>
        <p>{wrongCount > 0 ? `오답 ${wrongCount}문제를 먼저 보여드려요.` : "모든 문제를 맞혔어요."}</p>
      </div>
      <div className={styles.filters} role="group" aria-label="결과 필터">
        <button type="button" className={filter === "wrong" ? styles.activeFilter : styles.filterButton} disabled={wrongCount === 0} aria-pressed={filter === "wrong"} onClick={() => setFilter("wrong")}>오답만 {wrongCount}</button>
        <button type="button" className={filter === "all" ? styles.activeFilter : styles.filterButton} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>전체 {questions.length}</button>
      </div>
    </div>

    {visible.length === 0 ? <div className="empty-state"><h3>틀린 문제가 없어요.</h3><p>전체 결과에서 맞힌 문제를 확인할 수 있어요.</p></div> : visible.map(({ question, index }) => {
      const isCorrect = question.correct === true;
      return <article className={`result-question ${isCorrect ? "correct" : "wrong"}`} key={question.id}>
        <div className="row spread">
          <span className="question-number">Q{index + 1}</span>
          <strong className={isCorrect ? styles.correctText : styles.wrongText}>{isCorrect ? "정답" : "오답"}</strong>
        </div>
        <h3>{question.prompt}</h3>
        <AnswerComparison question={question} />
        <div className="explanation"><strong>해설</strong><p>{question.explanation}</p></div>
      </article>;
    })}
  </div>;
}
