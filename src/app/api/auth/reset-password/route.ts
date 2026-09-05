import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || password.length < 8) {
    return NextResponse.json({ error: "이메일과 8자 이상의 새 비밀번호가 필요해요." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    return NextResponse.json({ error: "비밀번호 초기화 설정이 아직 안 되어 있어요." }, { status: 503 });
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: "계정을 확인하지 못했어요." }, { status: 500 });

  const user = data.users.find((item) => item.email?.toLowerCase() === email);
  if (!user) return NextResponse.json({ error: "가입된 이메일을 찾지 못했어요." }, { status: 404 });

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (updateError) return NextResponse.json({ error: "비밀번호를 바꾸지 못했어요." }, { status: 500 });

  return NextResponse.json({ message: "비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요." });
}
