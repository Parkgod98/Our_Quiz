import type { PortableQuestion } from "./types";

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function sortedStrings(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? [...value].sort()
    : null;
}

export function evaluateAnswer(question: PortableQuestion, response: unknown) {
  switch (question.type) {
    case "single_choice":
      return response === question.answer;
    case "multiple_choice": {
      const received = sortedStrings(response);
      return received !== null && JSON.stringify(received) === JSON.stringify([...question.answer].sort());
    }
    case "true_false":
      return response === question.answer;
    case "short_answer":
      return typeof response === "string" && question.answer.some((answer) => normalizeText(answer) === normalizeText(response));
    case "ordering":
      return Array.isArray(response) && JSON.stringify(response) === JSON.stringify(question.answer);
  }
}
