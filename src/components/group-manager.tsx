"use client";

import Link from "next/link";
import { useState } from "react";

export type GroupOption = { id: string; name: string; inviteCode: string; isOwner: boolean };
export type VersionOption = { id: string; label: string };
export type Assignment = { groupId: string; versionId: string; label: string };

export function GroupManager({ groups, versions, assignments }: { groups: GroupOption[]; versions: VersionOption[]; assignments: Assignment[] }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [groupId, setGroupId] = useState(groups.find((group) => group.isOwner)?.id ?? "");
  const [versionId, setVersionId] = useState(versions[0]?.id ?? "");
  const [message, setMessage] = useState("");

  async function post(url: string, body: Record<string, string>) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = (await response.json()) as { error?: string; message?: string; group?: { invite_code?: string } };
    if (response.ok) {
      setMessage(payload.group?.invite_code ? `그룹 생성 완료. 초대 코드: ${payload.group.invite_code}` : payload.message ?? "처리 완료. 새로고침하면 반영됩니다.");
    } else {
      setMessage(payload.error ?? "실패했습니다.");
    }
  }

  return <div className="stack">
    <div className="feature-grid">
      <div className="panel stack"><h2>그룹 만들기</h2><input value={name} onChange={(event) => setName(event.target.value)} placeholder="스터디 이름" /><button onClick={() => post("/api/groups", { name })}>생성</button></div>
      <div className="panel stack"><h2>초대 코드로 참여</h2><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="AB12CD34" /><button onClick={() => post("/api/groups/join", { code })}>참여</button></div>
    </div>

    {groups.length > 0 && <div className="panel stack"><h2>내 그룹</h2>{groups.map((group) => <div className="list-row" key={group.id}><span><strong>{group.name}</strong><small>초대 코드 {group.inviteCode}</small></span><span>{group.isOwner ? "Owner" : "Member"}</span></div>)}</div>}

    {groups.some((group) => group.isOwner) && versions.length > 0 && <div className="panel stack"><h2>문제 Version 배정</h2><label>그룹<select value={groupId} onChange={(event) => setGroupId(event.target.value)}>{groups.filter((group) => group.isOwner).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label>Version<select value={versionId} onChange={(event) => setVersionId(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}</select></label><button disabled={!groupId || !versionId} onClick={() => post("/api/groups/assign", { groupId, versionId })}>배정</button></div>}

    {assignments.length > 0 && <div className="panel stack"><h2>배정된 문제</h2>{assignments.map((assignment) => <div className="list-row" key={`${assignment.groupId}-${assignment.versionId}`}><strong>{assignment.label}</strong><Link className="button-link" href={`/quiz/${assignment.versionId}?groupId=${assignment.groupId}`}>Start</Link></div>)}</div>}
    {message && <p className="notice">{message}</p>}
  </div>;
}
