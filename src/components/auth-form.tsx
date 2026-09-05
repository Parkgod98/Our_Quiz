"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

function friendlyError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "이메일 또는 비밀번호를 확인해 주세요.";
  if (lower.includes("user already registered")) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (lower.includes("password")) return "비밀번호는 8자 이상으로 입력해 주세요.";
  if (lower.includes("email")) return "이메일 주소를 확인해 주세요.";
  return "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export function AuthForm({ configured, initialMode = "login" }: { configured: boolean; initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function run() {
    if (!configured) return setMessage("서비스 연결 상태를 확인해 주세요.");
    if (!email.trim() || password.length < 8) return setMessage("이메일과 8자 이상의 비밀번호를 입력해 주세요.");
    if (mode === "signup" && password !== passwordConfirm) return setMessage("비밀번호가 서로 달라요.");

    setPending(true);
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    setPending(false);

    if (result.error) return setMessage(friendlyError(result.error.message));
    if (!result.data.session) return setMessage("지금은 가입을 완료할 수 없어요. 잠시 후 다시 시도해 주세요.");
    router.push("/dashboard");
    router.refresh();
  }

  return <div className="auth-card">
    <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>로그인</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>회원가입</button></div>
    <div className="stack auth-fields">
      <label>이메일<input type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>비밀번호<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} placeholder="8자 이상" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {mode === "signup" && <label>비밀번호 확인<input type="password" autoComplete="new-password" minLength={8} placeholder="한 번 더 입력해 주세요" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} /></label>}
      <button className="auth-submit" disabled={pending} onClick={() => void run()}>{pending ? "처리 중..." : mode === "login" ? "로그인" : "계정 만들기"}</button>
      {message && <p className="form-message">{message}</p>}
    </div>
    <p className="auth-switch">{mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"} <button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "회원가입" : "로그인"}</button></p>
  </div>;
}
