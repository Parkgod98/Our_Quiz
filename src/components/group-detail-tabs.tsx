"use client";

import Link from "next/link";
import { useState } from "react";
import { GroupActions, RemoveMemberButton } from "@/components/group-actions";
import { GroupAssignmentForm } from "@/components/group-assignment-form";

type TabKey = "learning" | "members" | "history" | "settings";

type GroupOverview = {
  currentUserId: string;
  group: {
    id: string;
    name: string;
    inviteCode: string;
    createdBy: string;
    createdAt: string;
  };
  role: "owner" | "member";
  members: Array<{
    userId: string;
    role: "owner" | "member";
    joinedAt: string;
    displayName: string;
  }>;
  assignments: Array<{
    versionId: string;
    assignedAt: string;
    versionNumber: number;
    questionCount: number;
    title: string;
    subject: string;
    weekNumber: number;
  }>;
  attempts: Array<{
    id: string;
    userId: string;
    score: number | null;
    correctCount: number;
    wrongCount: number | null;
    total: number;
    submittedAt: string | null;
    title: string;
    versionNumber: number;
  }>;
  versions: Array<{ id: string; label: string }>;
};

const tabs: Array<[TabKey, string]> = [
  ["learning", "학습"],
  ["members", "멤버"],
  ["history", "기록"],
  ["settings", "설정"],
];

export function GroupDetailTabs({ overview, initialTab = "learning" }: { overview: GroupOverview; initialTab?: TabKey }) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const isOwner = overview.role === "owner";

  function changeTab(tab: TabKey) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "learning") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }

  return <section className="stack page-section">
    <div className="group-detail-heading">
      <Link className="back-link" href="/groups">← 내 스터디</Link>
      <div className="row spread">
        <div>
          <span className="eyebrow">스터디</span>
          <h1>{overview.group.name}</h1>
          <p>멤버 {overview.members.length}명 · 문제집 {overview.assignments.length}개</p>
        </div>
        {isOwner && <span className="role-badge">운영자</span>}
      </div>
    </div>

    <nav className="tab-nav" aria-label="스터디 메뉴">
      {tabs.map(([key, label]) => {
        const active = activeTab === key;
        return <button
          type="button"
          className="text-button"
          aria-current={active ? "page" : undefined}
          onClick={() => changeTab(key)}
          key={key}
          style={{
            padding: "10px 14px",
            color: active ? "var(--text)" : "var(--muted)",
            fontSize: 14,
            fontWeight: 750,
            borderRadius: 0,
            borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
          }}
        >{label}</button>;
      })}
    </nav>

    {activeTab === "learning" && <div className="stack">
      {isOwner && <div className="panel stack">
        <div><h2>문제집 추가</h2><p className="muted">내 문제집에서 이 스터디가 함께 풀 문제를 선택하세요.</p></div>
        <GroupAssignmentForm groupId={overview.group.id} versions={overview.versions} />
      </div>}
      <div className="stack">
        <div className="section-heading"><h2>함께 풀 문제</h2></div>
        {overview.assignments.length === 0 ? <div className="empty-state"><h3>아직 추가된 문제집이 없어요.</h3><p>{isOwner ? "위에서 첫 문제집을 추가해 보세요." : "운영자가 문제집을 추가하면 여기에서 바로 풀 수 있어요."}</p></div> : overview.assignments.map((assignment) => <article className="study-assignment-card" key={assignment.versionId}>
          <div><span className="eyebrow">WEEK {assignment.weekNumber}</span><h3>{assignment.title}</h3><p>{assignment.subject} · {assignment.questionCount}문제</p></div>
          <Link className="button-link" href={`/quiz/${assignment.versionId}?groupId=${overview.group.id}`}>풀기</Link>
        </article>)}
      </div>
    </div>}

    {activeTab === "members" && <div className="panel stack">
      <h2>멤버</h2>
      {overview.members.map((member) => <div className="member-row" key={member.userId}>
        <div><strong>{member.displayName}</strong><small>{member.role === "owner" ? "운영자" : "멤버"}</small></div>
        {isOwner && member.role !== "owner" && <RemoveMemberButton groupId={overview.group.id} userId={member.userId} />}
      </div>)}
    </div>}

    {activeTab === "history" && <div className="panel stack">
      <div className="section-heading"><div><h2>학습 기록</h2><p>스터디 멤버는 서로의 점수와 오답 개수를 함께 볼 수 있어요.</p></div></div>
      {overview.attempts.length === 0 ? <p className="muted">아직 이 스터디에서 진행한 풀이가 없어요.</p> : overview.attempts.map((attempt) => {
        const member = overview.members.find((item) => item.userId === attempt.userId);
        const ownAttempt = attempt.userId === overview.currentUserId;
        const content = <>
          <span>
            <strong>{member?.displayName ?? "멤버"}</strong>
            <small>{attempt.title} · {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString("ko-KR") : "진행 중"}</small>
          </span>
          <span className="row">
            {attempt.submittedAt ? <>
              <strong>{attempt.score ?? 0} / {attempt.total}</strong>
              <small>정답 {attempt.correctCount} · 오답 {attempt.wrongCount ?? 0}</small>
            </> : <strong>진행 중</strong>}
            {ownAttempt && attempt.submittedAt && <span className="text-link">결과 보기 →</span>}
          </span>
        </>;

        return ownAttempt && attempt.submittedAt
          ? <Link className="list-row history-link" href={`/attempts/${attempt.id}`} key={attempt.id}>{content}</Link>
          : <div className="list-row" key={attempt.id}>{content}</div>;
      })}
    </div>}

    {activeTab === "settings" && <div className="panel stack">
      <h2>스터디 설정</h2>
      <GroupActions groupId={overview.group.id} groupName={overview.group.name} inviteCode={overview.group.inviteCode} isOwner={isOwner} />
    </div>}
  </section>;
}
