"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GroupActions({ groupId, groupName, isOwner, inviteCode }: { groupId: string; groupName: string; isOwner: boolean; inviteCode: string }) {
  const router = useRouter();
  const [name, setName] = useState(groupName);
  const [code, setCode] = useState(inviteCode);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function request(url: string, options: RequestInit) {
    setPending(true);
    setMessage("");
    const response = await fetch(url, options);
    const payload = (await response.json()) as { error?: string; message?: string; inviteCode?: string };
    setPending(false);
    if (!response.ok) {
      setMessage(payload.error ?? "요청을 처리하지 못했어요.");
      return false;
    }
    if (payload.inviteCode) setCode(payload.inviteCode);
    setMessage(payload.message ?? "변경사항을 저장했어요.");
    router.refresh();
    return true;
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setMessage("초대 코드를 복사했어요.");
  }

  if (!isOwner) {
    return <div className="stack">
      <div className="setting-row"><div><strong>스터디 나가기</strong><p className="muted">이 스터디의 문제와 기록 공유에서 빠집니다.</p></div><button className="danger-button" disabled={pending} onClick={async () => { if (confirm("이 스터디에서 나갈까요?")) { const ok = await request(`/api/groups/${groupId}/members/me`, { method: "DELETE" }); if (ok) router.push("/groups"); } }}>나가기</button></div>
      {message && <p className="notice">{message}</p>}
    </div>;
  }

  return <div className="stack">
    <div className="setting-row"><div><strong>스터디 이름</strong><p className="muted">멤버들에게 표시되는 이름입니다.</p></div><div className="row"><input value={name} onChange={(event) => setName(event.target.value)} /><button disabled={pending || !name.trim()} onClick={() => request(`/api/groups/${groupId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })}>저장</button></div></div>
    <div className="setting-row"><div><strong>초대 코드</strong><p className="muted">새 코드를 만들면 이전 코드는 바로 사용할 수 없어요.</p></div><div className="row"><code className="invite-code">{code}</code><button className="secondary" onClick={copyCode}>복사</button><button className="secondary" disabled={pending} onClick={() => request(`/api/groups/${groupId}/invite-code`, { method: "POST" })}>새로 만들기</button></div></div>
    <div className="setting-row danger-zone"><div><strong>스터디 삭제</strong><p className="muted">스터디와 배정 정보가 삭제됩니다. 개인 풀이 기록은 남습니다.</p></div><button className="danger-button" disabled={pending} onClick={async () => { if (confirm("스터디를 삭제할까요? 이 작업은 되돌릴 수 없어요.")) { const ok = await request(`/api/groups/${groupId}`, { method: "DELETE" }); if (ok) router.push("/groups"); } }}>스터디 삭제</button></div>
    {message && <p className="notice">{message}</p>}
  </div>;
}

export function RemoveMemberButton({ groupId, userId }: { groupId: string; userId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return <button className="text-button danger-text" disabled={pending} onClick={async () => {
    if (!confirm("이 멤버를 스터디에서 내보낼까요?")) return;
    setPending(true);
    await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }}>내보내기</button>;
}
