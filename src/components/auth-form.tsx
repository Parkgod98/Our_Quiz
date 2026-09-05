"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function run(mode: "login" | "signup") {
    if (!configured) {
      setMessage("Supabase 환경 변수를 먼저 연결해주세요.");
      return;
    }

    setPending(true);
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setPending(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setMessage(mode === "login" ? "로그인했습니다. Dashboard로 이동하세요." : "가입 요청이 완료되었습니다. 이메일 확인 설정에 따라 인증 메일을 확인하세요.");
  }

  return (
    <div className="panel stack">
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Password<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <div className="row">
        <button disabled={pending} onClick={() => run("login")}>로그인</button>
        <button className="secondary" disabled={pending} onClick={() => run("signup")}>회원가입</button>
      </div>
      {message && <p className="notice">{message}</p>}
    </div>
  );
}
