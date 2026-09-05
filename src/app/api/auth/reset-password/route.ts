import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_USERS = 1000;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) return null;
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; resetCode?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const resetCode = body.resetCode?.trim() ?? "";
  const configuredResetCode = process.env.PASSWORD_RESET_CODE;

  if (!email || password.length < 8 || !resetCode) {
    return NextResponse.json({ error: "이메일, 8자 이상의 새 비밀번호, 초기화 코드를 입력해 주세요." }, { status: 400 });
  }
  if (!configuredResetCode || resetCode !== configuredResetCode) {
    return NextResponse.json({ error: "초기화 코드가 올바르지 않아요." }, { status: 403 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "비밀번호 초기화 기능이 아직 설정되지 않았어요." }, { status: 503 });
  }

  const { data, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: MAX_USERS });
  if (listError) {
    return NextResponse.json({ error: "계정을 확인하지 못했어요." }, { status: 500 });
  }

  const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (!user) {
    return NextResponse.json({ error: "가입된 이메일을 찾지 못했어요." }, { status: 404 });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (updateError) {
    return NextResponse.json({ error: "비밀번호를 초기화하지 못했어요." }, { status: 500 });
  }

  return NextResponse.json({ message: "비밀번호를 초기화했어요. 새 비밀번호로 로그인해 주세요." });
}
