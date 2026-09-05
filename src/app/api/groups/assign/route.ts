import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { groupId?: string; versionId?: string };
  if (!body.groupId || !body.versionId) {
    return NextResponse.json({ error: "groupId와 versionId가 필요합니다." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { error } = await supabase.from("group_question_sets").insert({
    group_id: body.groupId,
    version_id: body.versionId,
    assigned_by: userData.user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: "그룹에 문제 Version을 배정했습니다." });
}
