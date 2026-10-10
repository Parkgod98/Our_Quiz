"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Group = { id: string; name: string; alreadyShared: boolean };

export function ShareQuestionSetForm({ versionId, groups }: { versionId: string; groups: Group[] }) {
  const router = useRouter();
  const [groupId, setGroupId] = useState(groups.find((group) => !group.alreadyShared)?.id ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const available = groups.filter((group) => !group.alreadyShared);

  if (groups.length === 0) return <div className="panel stack"><h2>스터디에 공유하기</h2><p>참여 중인 스터디가 없어요. 스터디를 만들거나 참여한 뒤 공유할 수 있어요.</p><Link className="button-link secondary" href="/groups">스터디로 이동</Link></div>;
  if (available.length === 0) return <div className="panel stack"><h2>스터디에 공유하기</h2><p>이 버전은 참여 중인 모든 스터디에 이미 공유했어요.</p></div>;

  async function share(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupId || pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/groups/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, versionId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "스터디에 문제집을 공유하지 못했어요.");
        return;
      }
      setMessage("문제집을 스터디에 공유했어요.");
      router.refresh();
    } catch {
      setMessage("연결에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return <form className="panel stack" onSubmit={share}>
    <h2>스터디에 공유하기</h2>
    <p className="muted">이 문제집을 함께 풀 스터디를 선택하세요.</p>
    <select aria-label="공유할 스터디" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
      {available.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
    </select>
    <div className="row">
      <button disabled={pending || !groupId}>{pending ? "공유 중..." : "선택한 스터디에 공유"}</button>
    </div>
    {message && <p className="notice" role="status">{message}</p>}
  </form>;
}
