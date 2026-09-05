"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ configured }: { configured: boolean }) {
  const router = useRouter();
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

    if (!result.data.session) {
      setMessage("회원가입은 되었지만 즉시 로그인되지 않았습니다. Supabase에서 Confirm email을 꺼주세요.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
