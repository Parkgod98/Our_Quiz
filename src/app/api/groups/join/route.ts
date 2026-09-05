import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string };
  if (!body.code?.trim()) return NextResponse.json({ error: "초대 코드가 필요합니다." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("join_group_by_code", { p_code: body.code.trim().toUpperCase() });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ groupId: data });
}
