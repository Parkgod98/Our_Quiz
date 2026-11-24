"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthMode = "login" | "signup" | "reset" | "update";

const submitLabels = {
  login: "로그인",
  signup: "계정 만들기",
  reset: "복구 메일 요청",
  update: "새 비밀번호 저장",
};

function friendlyError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "이메일 또는 비밀번호를 확인해 주세요.";
  if (lower.includes("user already registered")) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (lower.includes("password")) return "비밀번호는 8자 이상으로 입력해 주세요.";
  if (lower.includes("email")) return "이메일 주소를 확인해 주세요.";
  return "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

type AuthFormProps = {
  configured: boolean;
  initialMode: AuthMode;
  destination: string;
  linkExpired: boolean;
};

export function AuthForm({ configured, initialMode, destination, linkExpired }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState(linkExpired ? "인증 링크를 확인할 수 없어요. 다시 로그인하거나 비밀번호 찾기에서 새 링크를 요청해 주세요." : "");
  const [pending, setPending] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setPasswordConfirm("");
    setMessage("");
  }

  async function run() {
    if (!configured) return setMessage("서비스 연결 상태를 확인해 주세요.");
    if (mode !== "update" && !email.trim()) return setMessage("이메일 주소를 입력해 주세요.");
    if (mode !== "reset" && password.length < 8) return setMessage("8자 이상의 비밀번호를 입력해 주세요.");
    if ((mode === "signup" || mode === "update") && password !== passwordConfirm) {
      return setMessage("비밀번호가 서로 달라요.");
    }

    setPending(true);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: new URL("/", window.location.origin).href,
        });
        if (error?.status === 0) return setMessage("서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return setMessage("가입한 주소라면 복구 메일을 받을 수 있어요. 이 브라우저에서 메일의 링크를 열어 주세요.");
      }

      if (mode === "update") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return setMessage("비밀번호를 변경하지 못했어요. 다른 비밀번호로 시도하거나 새 복구 링크를 요청해 주세요.");
      } else {
        const result = mode === "login"
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({ email: email.trim(), password });
        if (result.error) return setMessage(friendlyError(result.error.message));
        if (!result.data.session) return setMessage("가입한 이메일의 확인 안내를 확인한 뒤 로그인해 주세요.");
      }
      router.replace(destination);
      router.refresh();
    } catch {
      setMessage("서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return <div className="auth-card">
    {mode === "update" ? <h2>새 비밀번호 설정</h2> : <div className="auth-tabs" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
      <button type="button" disabled={pending} className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>로그인</button>
      <button type="button" disabled={pending} className={mode === "signup" ? "active" : ""} onClick={() => changeMode("signup")}>회원가입</button>
      <button type="button" disabled={pending} className={mode === "reset" ? "active" : ""} onClick={() => changeMode("reset")}>비밀번호 찾기</button>
    </div>}

    <form className="stack auth-fields" onSubmit={(event) => { event.preventDefault(); if (!pending) void run(); }}>
      {mode !== "update" && <label>이메일
        <input type="email" required autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>}
      {mode !== "reset" && <label>{mode === "update" ? "새 비밀번호" : "비밀번호"}
        <input type="password" required autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} placeholder="8자 이상" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>}
      {(mode === "signup" || mode === "update") && <label>비밀번호 확인
        <input type="password" required autoComplete="new-password" minLength={8} placeholder="한 번 더 입력해 주세요" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} />
      </label>}
      <button type="submit" className="auth-submit" disabled={pending}>{pending ? "처리 중..." : submitLabels[mode]}</button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
    {(mode === "login" || mode === "signup") && <p className="auth-switch">
      {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
      <button type="button" disabled={pending} className="text-button" onClick={() => changeMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "회원가입" : "로그인"}</button>
    </p>}
    {mode === "update" && <button type="button" disabled={pending} className="text-button" onClick={() => changeMode("reset")}>복구 링크 다시 요청</button>}
  </div>;
}
