import { NextResponse } from "next/server";
import { logServerError } from "@/lib/server/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SubmitBody = { responses?: Record<string, unknown> };

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const body = (await request.json()) as SubmitBody;
  if (!body.responses || typeof body.responses !== "object") return NextResponse.json({ error: "답안 정보가 필요합니다." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_existing_attempt", {
    p_attempt_id: attemptId,
    p_responses: body.responses,
  });

  if (error) {
    logServerError("api.attempts.submit", error, { attemptId });
    return NextResponse.json({ error: "제출하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 400 });
  }
  return NextResponse.json(data);
}
