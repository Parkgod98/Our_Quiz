"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function GroupAssignmentForm({ groupId, versions }: { groupId: string; versions: Array<{ id: string; label: string }> }) {
  const router = useRouter();
  const [versionId, setVersionId] = useState(versions[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!versions.some((item) => item.id === versionId)) {
      setVersionId(versions[0]?.id ?? "");
    }
  }, [versions, versionId]);

  if (versions.length === 0) return <div className="empty-state compact"><p>공유할 수 있는 새 문제집이 없어요. 이미 모두 공유했거나, 내 문제집이 아직 없을 수 있어요.</p></div>;

  async function share(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!versionId || pending) return;
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
        setMessage(payload.error ?? "문제집을 추가하지 못했어요.");
        return;
      }
      setMessage("스터디에 문제집을 추가했어요.");
      router.refresh();
    } catch {
      setMessage("연결에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return <form className="row assignment-form" onSubmit={share}>
    <select aria-label="공유할 문제집" value={versionId} onChange={(event) => setVersionId(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}</select>
    <button disabled={pending || !versionId}>{pending ? "추가 중..." : "문제집 추가"}</button>
    {message && <span className="muted" role="status">{message}</span>}
  </form>;
}
