import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StartBody = { versionId?: string; groupId?: string };

export async function POST(request: Request) {
  const body = (await request.json()) as StartBody;
  if (!body.versionId) return NextResponse.json({ error: "문제집 정보가 필요합니다." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data, error } = await supabase.rpc("start_or_resume_attempt", { p_version_id: body.versionId, p_group_id: body.groupId ?? null });
  if (error) return NextResponse.json({ error: "풀이를 시작하지 못했어요." }, { status: 400 });
  return NextResponse.json(data);
}
