import { NextResponse } from "next/server";
import { validateQuestionSet } from "@/lib/questions/validator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase가 연결되지 않았습니다." }, { status: 503 });
  const rawText = await request.text();
  if (rawText.length > 2_000_000) return NextResponse.json({ error: "Payload는 2MB 이하여야 합니다." }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(rawText); } catch { return NextResponse.json({ error: "유효한 JSON이 아닙니다." }, { status: 400 }); }
  const validation = validateQuestionSet(input);
  if (!validation.success) return NextResponse.json({ error: "Question Set 검증에 실패했습니다.", details: validation.errors }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase.rpc("import_question_set", { p_payload: validation.data });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: "문제 세트를 저장했습니다.", data });
}
