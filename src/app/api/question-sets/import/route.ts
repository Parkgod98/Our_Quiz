import { NextResponse } from "next/server";
import { validateQuestionSet } from "@/lib/questions/validator";
import { logServerError } from "@/lib/server/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase가 연결되지 않았습니다." }, { status: 503 });
  const rawText = await request.text();
  if (rawText.length > 2_000_000) return NextResponse.json({ error: "Payload는 2MB 이하여야 합니다." }, { status: 413 });

  let input: unknown;
  try {
    input = JSON.parse(rawText);
  } catch (error) {
    logServerError("api.question-sets.import.parse", error);
    return NextResponse.json({ error: "유효한 JSON이 아닙니다." }, { status: 400 });
  }

  const validation = validateQuestionSet(input);
  if (!validation.success) return NextResponse.json({ error: "Question Set 검증에 실패했습니다.", details: validation.errors }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("import_question_set", { p_payload: validation.data });
  if (error) {
    logServerError("api.question-sets.import", error, { setId: validation.data.setId, version: validation.data.version });
    return NextResponse.json({ error: "문제집을 추가하지 못했어요." }, { status: 400 });
  }
  return NextResponse.json({ message: "문제 세트를 저장했습니다.", data });
}
