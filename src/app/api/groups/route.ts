import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "그룹 이름이 필요합니다." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data: group, error } = await supabase.from("study_groups").insert({ name: body.name.trim(), created_by: userData.user.id }).select("id,name,invite_code").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const memberResult = await supabase.from("group_members").insert({ group_id: group.id, user_id: userData.user.id, role: "owner" });
  if (memberResult.error) return NextResponse.json({ error: memberResult.error.message }, { status: 400 });
  return NextResponse.json({ group });
}
