import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
  const { groupId, userId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const targetUserId = userId === "me" ? userData.user.id : userId;
  const { data: group } = await supabase.from("study_groups").select("created_by").eq("id", groupId).single();
  if (!group) return NextResponse.json({ error: "스터디를 찾을 수 없어요." }, { status: 404 });
  if (targetUserId === group.created_by) return NextResponse.json({ error: "운영자는 스터디에서 나갈 수 없어요. 스터디 삭제를 사용해 주세요." }, { status: 400 });
  if (targetUserId !== userData.user.id && group.created_by !== userData.user.id) return NextResponse.json({ error: "멤버를 내보낼 권한이 없어요." }, { status: 403 });

  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", targetUserId);
  if (error) return NextResponse.json({ error: "멤버 정보를 변경하지 못했어요." }, { status: 400 });
  return NextResponse.json({ message: targetUserId === userData.user.id ? "스터디에서 나왔어요." : "멤버를 스터디에서 내보냈어요." });
}
