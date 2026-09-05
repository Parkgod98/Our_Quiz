import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const inviteCode = randomBytes(5).toString("hex").slice(0, 8).toUpperCase();
    const { data, error } = await supabase.from("study_groups").update({ invite_code: inviteCode }).eq("id", groupId).select("invite_code").single();
    if (!error && data) return NextResponse.json({ message: "새 초대 코드를 만들었어요.", inviteCode: data.invite_code });
    if (error?.code !== "23505") return NextResponse.json({ error: "초대 코드를 새로 만들지 못했어요." }, { status: 400 });
  }
  return NextResponse.json({ error: "초대 코드를 새로 만들지 못했어요. 다시 시도해 주세요." }, { status: 409 });
}
