import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/quiz-player";
import type { Choice, PlayableQuestionSet, QuestionType } from "@/lib/questions/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type QuestionRow = { question_key: string; type: QuestionType; topic: string; difficulty: number; prompt: string; choices: Choice[] | null; items: Choice[] | null; order_index: number };
type VersionRow = { id: string; version_number: number; question_count: number; question_sets: { portable_set_id: string; title: string; subject: string; week_number: number; description: string | null }; questions: QuestionRow[] };

export default async function QuizVersionPage({ params }: { params: Promise<{ versionId: string }> }) {
  if (!isSupabaseConfigured()) return <section className="narrow panel"><h1>Supabase 연결 필요</h1><p>실제 Version 풀이는 Supabase 프로젝트 연결 후 활성화됩니다.</p></section>;
  const { versionId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("question_set_versions").select("id,version_number,question_count,question_sets!inner(portable_set_id,title,subject,week_number,description),questions(question_key,type,topic,difficulty,prompt,choices,items,order_index)").eq("id", versionId).single();
  if (error || !data) notFound();
  const row = data as unknown as VersionRow;
  const questionSet: PlayableQuestionSet = {
    schemaVersion: "1.0",
    setId: row.question_sets.portable_set_id,
    title: row.question_sets.title,
    subject: row.question_sets.subject,
    week: row.question_sets.week_number,
    version: row.version_number,
    description: row.question_sets.description ?? undefined,
    questions: [...row.questions].sort((a, b) => a.order_index - b.order_index).map((question) => {
      const base = { id: question.question_key, type: question.type, topic: question.topic, difficulty: question.difficulty as 1 | 2 | 3 | 4 | 5, prompt: question.prompt };
      if (question.type === "single_choice" || question.type === "multiple_choice") return { ...base, type: question.type, choices: question.choices ?? [] };
      if (question.type === "ordering") return { ...base, type: "ordering" as const, items: question.items ?? [] };
      return { ...base, type: question.type };
    }),
  };
  return <section className="narrow"><QuizPlayer questionSet={questionSet} versionId={versionId} /></section>;
}
