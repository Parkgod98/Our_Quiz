export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "ordering";

export type Choice = {
  id: string;
  text: string;
};

export type BaseQuestion = {
  id: string;
  type: QuestionType;
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  prompt: string;
  explanation: string;
};

export type SingleChoiceQuestion = BaseQuestion & {
  type: "single_choice";
  choices: Choice[];
  answer: string;
};

export type MultipleChoiceQuestion = BaseQuestion & {
  type: "multiple_choice";
  choices: Choice[];
  answer: string[];
};

export type TrueFalseQuestion = BaseQuestion & {
  type: "true_false";
  answer: boolean;
};

export type ShortAnswerQuestion = BaseQuestion & {
  type: "short_answer";
  answer: string[];
};

export type OrderingQuestion = BaseQuestion & {
  type: "ordering";
  items: Choice[];
  answer: string[];
};

export type PortableQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | OrderingQuestion;

export type PortableQuestionSet = {
  schemaVersion: "1.0";
  setId: string;
  title: string;
  subject: string;
  week: number;
  version: number;
  description?: string;
  questions: PortableQuestion[];
};

export type ValidationResult =
  | { success: true; data: PortableQuestionSet }
  | { success: false; errors: string[] };
