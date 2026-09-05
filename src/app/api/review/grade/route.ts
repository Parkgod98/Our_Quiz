import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GradeBody = { responses?: Record<string, unknown> };

export async function POST(request: Request) {
  const body = (await request.json()) as GradeBody;
  if (!body.responses || typeof body.responses !== "object") return NextResponse.json({ error: "복습 답안이 필요합니다." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data, error } = await supabase.rpc("grade_review_answers", { p_responses: body.responses });
  if (error) return NextResponse.json({ error: "복습 답안을 채점하지 못했어요." }, { status: 400 });
  return NextResponse.json({ results: data });
}
