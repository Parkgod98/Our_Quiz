"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type GroupSummary = { id: string; name: string; role: "owner" | "member"; memberCount: number; assignmentCount: number };

export function GroupDirectory({ groups }: { groups: GroupSummary[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function post(url: string, body: Record<string, string>) {
    setPending(true);
    setMessage("");
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = (await response.json()) as { error?: string; group?: { id?: string } };
    setPending(false);
    if (!response.ok) {
      setMessage(payload.error ?? "요청을 처리하지 못했어요.");
      return;
    }
    setName("");
    setCode("");
    setMessage(url.endsWith("/join") ? "스터디에 참여했어요." : "새 스터디를 만들었어요.");
    router.refresh();
  }

  return <div className="stack">
    <div className="group-create-grid">
      <form className="panel stack" onSubmit={(event) => { event.preventDefault(); void post("/api/groups", { name }); }}>
        <h2>새 스터디 만들기</h2>
        <p className="muted">함께 문제를 풀 멤버를 초대할 수 있어요.</p>
        <input aria-label="스터디 이름" value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 반도체 스터디" />
        <button disabled={pending || !name.trim()}>만들기</button>
      </form>
      <form className="panel stack" onSubmit={(event) => { event.preventDefault(); void post("/api/groups/join", { code }); }}>
        <h2>초대 코드로 참여하기</h2>
        <p className="muted">받은 8자리 초대 코드를 입력해 주세요.</p>
        <input aria-label="초대 코드" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="AB12CD34" maxLength={8} />
        <button className="secondary" disabled={pending || !code.trim()}>참여하기</button>
      </form>
    </div>

    {message && <p className="notice">{message}</p>}

    <div className="group-grid">
      {groups.map((group) => <Link className="group-card" href={`/groups/${group.id}`} key={group.id}>
        <div className="row spread"><span className="role-badge">{group.role === "owner" ? "운영 중" : "참여 중"}</span><span aria-hidden>→</span></div>
        <h2>{group.name}</h2>
        <div className="group-meta"><span>멤버 {group.memberCount}명</span><span>문제집 {group.assignmentCount}개</span></div>
      </Link>)}
    </div>

    {groups.length === 0 && <div className="empty-state"><h2>아직 참여 중인 스터디가 없어요.</h2><p>새 스터디를 만들거나 초대 코드로 참여해 보세요.</p></div>}
  </div>;
}
