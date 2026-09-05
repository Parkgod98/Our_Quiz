import { NextResponse } from "next/server";
import { logServerError } from "@/lib/server/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ResponseBody = { questionId?: string; response?: unknown };

export async function PUT(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const body = (await request.json()) as ResponseBody;
  if (!body.questionId || body.response === undefined) return NextResponse.json({ error: "답안을 저장할 수 없어요." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_attempt_response", {
    p_attempt_id: attemptId,
    p_question_key: body.questionId,
    p_response: body.response,
  });

  if (error) {
    logServerError("api.attempts.response", error, { attemptId, questionId: body.questionId });
    return NextResponse.json({ error: "답안을 저장하지 못했어요." }, { status: 400 });
  }
  return NextResponse.json({ saved: true });
}
