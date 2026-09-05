"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "reset";

function friendlyError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "이메일 또는 비밀번호를 확인해 주세요.";
  if (lower.includes("user already registered")) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (lower.includes("password")) return "비밀번호는 8자 이상으로 입력해 주세요.";
  if (lower.includes("email")) return "이메일 주소를 확인해 주세요.";
  return "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export function AuthForm({ configured, initialMode = "login" }: { configured: boolean; initialMode?: "login" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setPassword("");
    setPasswordConfirm("");
    setMessage("");
  }

  async function run() {
    if (!configured) return setMessage("서비스 연결 상태를 확인해 주세요.");
    if (!email.trim() || password.length < 8) return setMessage("이메일과 8자 이상의 비밀번호를 입력해 주세요.");
    if ((mode === "signup" || mode === "reset") && password !== passwordConfirm) return setMessage("비밀번호가 서로 달라요.");

    setPending(true);
    setMessage("");

    if (mode === "reset") {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      setPending(false);
      if (!response.ok) return setMessage(payload.error ?? "비밀번호를 초기화하지 못했어요.");
      setMessage(payload.message ?? "비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.");
      setTimeout(() => changeMode("login"), 900);
      return;
    }

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
    <div className="auth-tabs">
      <button type="button" className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>로그인</button>
      <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => changeMode("signup")}>회원가입</button>
      <button type="button" className={mode === "reset" ? "active" : ""} onClick={() => changeMode("reset")}>비밀번호 초기화</button>
    </div>
    <form className="stack auth-fields" onSubmit={(event) => { event.preventDefault(); if (!pending) void run(); }}>
      <label>이메일<input type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>{mode === "reset" ? "새 비밀번호" : "비밀번호"}<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} placeholder="8자 이상" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {(mode === "signup" || mode === "reset") && <label>비밀번호 확인<input type="password" autoComplete="new-password" minLength={8} placeholder="한 번 더 입력해 주세요" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} /></label>}
      <button type="submit" className="auth-submit" disabled={pending}>{pending ? "처리 중..." : mode === "login" ? "로그인" : mode === "signup" ? "계정 만들기" : "비밀번호 바꾸기"}</button>
      {message && <p className="form-message">{message}</p>}
    </form>
    {mode !== "reset" && <p className="auth-switch">{mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"} <button type="button" className="text-button" onClick={() => changeMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "회원가입" : "로그인"}</button></p>}
  </div>;
}
