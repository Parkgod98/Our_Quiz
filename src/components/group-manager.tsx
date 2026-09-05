"use client";

import { useState } from "react";

export function GroupManager() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function post(url: string, body: Record<string, string>) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = (await response.json()) as { error?: string; group?: { invite_code?: string } };
    setMessage(response.ok ? payload.group?.invite_code ? `그룹 생성 완료. 초대 코드: ${payload.group.invite_code}` : "처리 완료" : payload.error ?? "실패했습니다.");
  }

  return <div className="feature-grid">
    <div className="panel stack"><h2>그룹 만들기</h2><input value={name} onChange={(event) => setName(event.target.value)} placeholder="스터디 이름" /><button onClick={() => post("/api/groups", { name })}>생성</button></div>
    <div className="panel stack"><h2>초대 코드로 참여</h2><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="AB12CD34" /><button onClick={() => post("/api/groups/join", { code })}>참여</button></div>
    {message && <p className="notice">{message}</p>}
  </div>;
}
