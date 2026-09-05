import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/quiz-player";
import type { Choice, PlayableQuestionSet, QuestionType } from "@/lib/questions/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type PlayableRow = {
  id: string;
  versionNumber: number;
  questionCount: number;
  setId: string;
  title: string;
  subject: string;
  week: number;
  description: string | null;
  questions: Array<{
    id: string;
    type: QuestionType;
    topic: string;
    difficulty: number;
    prompt: string;
    choices: Choice[] | null;
    items: Choice[] | null;
  }>;
};

export default async function QuizVersionPage({ params, searchParams }: { params: Promise<{ versionId: string }>; searchParams: Promise<{ groupId?: string }> }) {
  if (!isSupabaseConfigured()) return <section className="narrow panel"><h1>문제를 불러올 수 없어요.</h1><p>서비스 연결 상태를 확인한 뒤 다시 시도해 주세요.</p></section>;

  const [{ versionId }, { groupId }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_playable_question_set", {
    p_version_id: versionId,
    p_group_id: groupId ?? null,
  });

  if (error || !data) notFound();

  const row = data as unknown as PlayableRow;
  const questionSet: PlayableQuestionSet = {
    schemaVersion: "1.0",
    setId: row.setId,
    title: row.title,
    subject: row.subject,
    week: row.week,
    version: row.versionNumber,
    description: row.description ?? undefined,
    questions: row.questions.map((question) => {
      const base = {
        id: question.id,
        type: question.type,
        topic: question.topic,
        difficulty: question.difficulty as 1 | 2 | 3 | 4 | 5,
        prompt: question.prompt,
      };
      if (question.type === "single_choice" || question.type === "multiple_choice") return { ...base, type: question.type, choices: question.choices ?? [] };
      if (question.type === "ordering") return { ...base, type: "ordering" as const, items: question.items ?? [] };
      return { ...base, type: question.type };
    }),
  };

  return <section><QuizPlayer questionSet={questionSet} versionId={versionId} groupId={groupId} /></section>;
}
