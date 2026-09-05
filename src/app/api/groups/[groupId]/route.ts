import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "스터디 이름을 입력해 주세요." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { error } = await supabase.from("study_groups").update({ name }).eq("id", groupId);
  if (error) return NextResponse.json({ error: "스터디 이름을 변경하지 못했어요." }, { status: 400 });
  return NextResponse.json({ message: "스터디 이름을 변경했어요." });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { error } = await supabase.from("study_groups").delete().eq("id", groupId);
  if (error) return NextResponse.json({ error: "스터디를 삭제하지 못했어요." }, { status: 400 });
  return NextResponse.json({ message: "스터디를 삭제했어요." });
}
