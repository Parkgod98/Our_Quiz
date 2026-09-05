"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GroupAssignmentForm({ groupId, versions }: { groupId: string; versions: Array<{ id: string; label: string }> }) {
  const router = useRouter();
  const [versionId, setVersionId] = useState(versions[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  if (versions.length === 0) return <div className="empty-state compact"><p>추가할 수 있는 문제집이 없어요. 먼저 문제집을 추가해 주세요.</p></div>;

  return <form className="row assignment-form" onSubmit={async (event) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/groups/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId, versionId }) });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) return setMessage(payload.error ?? "문제집을 추가하지 못했어요.");
    setMessage("스터디에 문제집을 추가했어요.");
    router.refresh();
  }}>
    <select aria-label="추가할 문제집" value={versionId} onChange={(event) => setVersionId(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}</select>
    <button disabled={pending || !versionId}>{pending ? "추가 중..." : "문제집 추가"}</button>
    {message && <span className="muted">{message}</span>}
  </form>;
}
