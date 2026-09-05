import { NextResponse } from "next/server";
import { logServerError } from "@/lib/server/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FlagBody = { questionId?: string; flagged?: boolean };

export async function PUT(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const body = (await request.json()) as FlagBody;
  if (!body.questionId || typeof body.flagged !== "boolean") return NextResponse.json({ error: "표시 상태를 저장할 수 없어요." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_attempt_flag", {
    p_attempt_id: attemptId,
    p_question_key: body.questionId,
    p_flagged: body.flagged,
  });

  if (error) {
    logServerError("api.attempts.flag", error, { attemptId, questionId: body.questionId, flagged: body.flagged });
    return NextResponse.json({ error: "문제 표시를 저장하지 못했어요." }, { status: 400 });
  }
  return NextResponse.json({ saved: true });
}
