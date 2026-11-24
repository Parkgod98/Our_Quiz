import { NextResponse } from "next/server";
import { logServerError } from "@/lib/server/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: { groupId?: string; versionId?: string };
  try {
    body = await request.json() as { groupId?: string; versionId?: string };
  } catch {
    return NextResponse.json({ error: "요청 정보를 확인해 주세요." }, { status: 400 });
  }
  if (!body.groupId || !body.versionId) {
    return NextResponse.json({ error: "스터디와 문제집을 선택해 주세요." }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) logServerError("api.groups.assign.auth", authError);
  if (!userData.user) return NextResponse.json({ error: "다시 로그인해 주세요." }, { status: 401 });

  const { error } = await supabase.from("group_question_sets").insert({
    group_id: body.groupId,
    version_id: body.versionId,
    assigned_by: userData.user.id,
  });

  if (error) {
    logServerError("api.groups.assign.insert", error, { groupId: body.groupId, versionId: body.versionId });
    if (error.code === "23505") return NextResponse.json({ error: "이 문제집은 이미 해당 스터디에 공유되어 있어요." }, { status: 409 });
    if (error.code === "42501") return NextResponse.json({ error: "참여 중인 스터디에 본인 문제집만 공유할 수 있어요." }, { status: 403 });
    if (error.code === "23503") return NextResponse.json({ error: "스터디 또는 문제집을 찾을 수 없어요. 목록을 새로고침해 주세요." }, { status: 404 });
    return NextResponse.json({ error: "문제집을 공유하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ message: "스터디에 문제집을 공유했어요." });
}
