import type { PortableQuestionSet, ValidationResult } from "./types";

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const safeId = /^[A-Za-z0-9._-]+$/;
const topicPattern = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;
const questionTypes = new Set([
  "single_choice",
  "multiple_choice",
  "true_false",
  "short_answer",
  "ordering",
]);

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, max = 4000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function validateChoiceArray(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value) || value.length < 2) {
    errors.push(`${path}: 2개 이상의 항목이 필요합니다.`);
    return new Set<string>();
  }

  const ids = new Set<string>();
  value.forEach((item, index) => {
    if (!isRecord(item) || !isNonEmptyString(item.id, 80) || !safeId.test(item.id)) {
      errors.push(`${path}[${index}].id: 유효한 ID가 필요합니다.`);
      return;
    }
    if (!isNonEmptyString(item.text, 1000)) {
      errors.push(`${path}[${index}].text: 비어 있지 않은 텍스트가 필요합니다.`);
    }
    if (ids.has(item.id)) {
      errors.push(`${path}: '${item.id}' ID가 중복됩니다.`);
    }
    ids.add(item.id);
  });

  return ids;
}

export function validateQuestionSet(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { success: false, errors: ["루트 값은 JSON object여야 합니다."] };
  }

  if (input.schemaVersion !== "1.0") {
    errors.push("schemaVersion: 현재 지원 버전은 '1.0'입니다.");
  }
  if (!isNonEmptyString(input.setId, 100) || !kebabCase.test(input.setId)) {
    errors.push("setId: 영문 소문자/숫자 kebab-case여야 합니다.");
  }
  if (!isNonEmptyString(input.title, 200)) errors.push("title: 제목이 필요합니다.");
  if (!isNonEmptyString(input.subject, 100)) errors.push("subject: 과목명이 필요합니다.");
  if (!Number.isInteger(input.week) || Number(input.week) < 1) errors.push("week: 1 이상의 정수여야 합니다.");
  if (!Number.isInteger(input.version) || Number(input.version) < 1) errors.push("version: 1 이상의 정수여야 합니다.");
  if (input.description !== undefined && !isNonEmptyString(input.description, 1000)) {
    errors.push("description: 문자열이어야 합니다.");
  }

  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    errors.push("questions: 최소 1개의 문제가 필요합니다.");
  } else if (input.questions.length > 500) {
    errors.push("questions: 한 파일에는 최대 500문제까지 허용합니다.");
  } else {
    const questionIds = new Set<string>();

    input.questions.forEach((question, index) => {
      const path = `questions[${index}]`;
      if (!isRecord(question)) {
        errors.push(`${path}: object여야 합니다.`);
        return;
      }

      if (!isNonEmptyString(question.id, 100) || !safeId.test(question.id)) {
        errors.push(`${path}.id: 영문/숫자/._- 조합의 ID가 필요합니다.`);
      } else if (questionIds.has(question.id)) {
        errors.push(`${path}.id: '${question.id}'가 중복됩니다.`);
      } else {
        questionIds.add(question.id);
      }

      if (!isNonEmptyString(question.type, 40) || !questionTypes.has(question.type)) {
        errors.push(`${path}.type: 지원하지 않는 문제 유형입니다.`);
        return;
      }
      if (!isNonEmptyString(question.topic, 160) || !topicPattern.test(question.topic)) {
        errors.push(`${path}.topic: 점(.) 기반 계층 Topic 형식이어야 합니다.`);
      }
      if (!Number.isInteger(question.difficulty) || Number(question.difficulty) < 1 || Number(question.difficulty) > 5) {
        errors.push(`${path}.difficulty: 1~5 정수여야 합니다.`);
      }
      if (!isNonEmptyString(question.prompt, 4000)) errors.push(`${path}.prompt: 문제 본문이 필요합니다.`);
      if (!isNonEmptyString(question.explanation, 4000)) errors.push(`${path}.explanation: 해설이 필요합니다.`);

      if (question.type === "single_choice" || question.type === "multiple_choice") {
        const choiceIds = validateChoiceArray(question.choices, `${path}.choices`, errors);
        if (question.type === "single_choice") {
          if (!isNonEmptyString(question.answer, 80) || !choiceIds.has(question.answer)) {
            errors.push(`${path}.answer: choices에 존재하는 단일 ID여야 합니다.`);
          }
        } else {
          if (!Array.isArray(question.answer) || question.answer.length === 0 || question.answer.some((answer) => typeof answer !== "string" || !choiceIds.has(answer))) {
            errors.push(`${path}.answer: choices에 존재하는 ID 배열이어야 합니다.`);
          }
        }
      }

      if (question.type === "true_false" && typeof question.answer !== "boolean") {
        errors.push(`${path}.answer: true/false여야 합니다.`);
      }

      if (question.type === "short_answer") {
        if (!Array.isArray(question.answer) || question.answer.length === 0 || question.answer.some((answer) => !isNonEmptyString(answer, 300))) {
          errors.push(`${path}.answer: 허용 정답 문자열 배열이 필요합니다.`);
        }
      }

      if (question.type === "ordering") {
        const itemIds = validateChoiceArray(question.items, `${path}.items`, errors);
        if (!Array.isArray(question.answer) || question.answer.length !== itemIds.size || question.answer.some((answer) => typeof answer !== "string" || !itemIds.has(answer))) {
          errors.push(`${path}.answer: 모든 item ID를 한 번씩 포함한 순서 배열이어야 합니다.`);
        }
      }
    });
  }

  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: input as PortableQuestionSet };
}
