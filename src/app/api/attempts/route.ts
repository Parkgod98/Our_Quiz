import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type SubmitBody = { versionId?: string; groupId?: string; responses?: Record<string, unknown> };

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase가 연결되지 않았습니다." }, { status: 503 });
  const body = (await request.json()) as SubmitBody;
  if (!body.versionId || !body.responses || typeof body.responses !== "object") return NextResponse.json({ error: "versionId와 responses가 필요합니다." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data, error } = await supabase.rpc("submit_attempt", { p_version_id: body.versionId, p_responses: body.responses, p_group_id: body.groupId ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
