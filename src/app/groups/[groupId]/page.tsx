import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupActions, RemoveMemberButton } from "@/components/group-actions";
import { GroupAssignmentForm } from "@/components/group-assignment-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MembershipRow = { user_id: string; role: "owner" | "member"; joined_at: string };
type ProfileRow = { id: string; display_name: string | null };
type AssignmentRow = { group_id: string; version_id: string; assigned_at: string; version_number: number; question_count: number; title: string; subject: string; week_number: number };
type AttemptRow = { id: string; user_id: string; score: number | null; total: number; submitted_at: string | null; question_set_versions: { version_number: number; question_sets: { title: string } } };
type SetRow = { title: string; question_set_versions: Array<{ id: string; version_number: number; question_count: number }> };

const tabs = [
  ["learning", "학습"],
  ["members", "멤버"],
  ["history", "기록"],
  ["settings", "설정"],
] as const;

export default async function GroupDetailPage({ params, searchParams }: { params: Promise<{ groupId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ groupId }, { tab }] = await Promise.all([params, searchParams]);
  const activeTab = tabs.some(([key]) => key === tab) ? tab! : "learning";
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) notFound();

  const { data: group } = await supabase.from("study_groups").select("id,name,invite_code,created_by,created_at").eq("id", groupId).single();
  if (!group) notFound();

  const [membersResult, assignmentsResult, attemptsResult, setsResult] = await Promise.all([
    supabase.from("group_members").select("user_id,role,joined_at").eq("group_id", groupId).order("joined_at"),
    supabase.rpc("get_group_assignments", { p_group_id: groupId }),
    supabase.from("attempts").select("id,user_id,score,total,submitted_at,question_set_versions!inner(version_number,question_sets!inner(title))").eq("group_id", groupId).order("submitted_at", { ascending: false }).limit(50),
    supabase.from("question_sets").select("title,question_set_versions(id,version_number,question_count)").eq("owner_id", userData.user.id),
  ]);

  const members = (membersResult.data ?? []) as MembershipRow[];
  const memberIds = members.map((member) => member.user_id);
  const profilesResult = memberIds.length > 0 ? await supabase.from("profiles").select("id,display_name").in("id", memberIds) : { data: [] as ProfileRow[] };
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.display_name || "이름 없음"]));
  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const attempts = (attemptsResult.data ?? []) as unknown as AttemptRow[];
  const sets = (setsResult.data ?? []) as unknown as SetRow[];
  const currentMembership = members.find((member) => member.user_id === userData.user.id);
  if (!currentMembership) notFound();
  const isOwner = currentMembership.role === "owner";
  const versions = sets.flatMap((set) => set.question_set_versions.map((version) => ({ id: version.id, label: `${set.title} · v${version.version_number} · ${version.question_count}문제` })));

  return <section className="stack page-section">
    <div className="group-detail-heading">
      <Link className="back-link" href="/groups">← 내 스터디</Link>
      <div className="row spread"><div><span className="eyebrow">스터디</span><h1>{group.name}</h1><p>멤버 {members.length}명 · 문제집 {assignments.length}개</p></div>{isOwner && <span className="role-badge">운영자</span>}</div>
    </div>

    <nav className="tab-nav" aria-label="스터디 메뉴">{tabs.map(([key, label]) => <Link className={activeTab === key ? "active" : ""} href={`/groups/${groupId}?tab=${key}`} key={key}>{label}</Link>)}</nav>

    {activeTab === "learning" && <div className="stack">
      {isOwner && <div className="panel stack"><div><h2>문제집 추가</h2><p className="muted">내 문제집에서 이 스터디가 함께 풀 문제를 선택하세요.</p></div><GroupAssignmentForm groupId={groupId} versions={versions} /></div>}
      <div className="stack"><div className="section-heading"><h2>함께 풀 문제</h2></div>{assignmentsResult.error ? <div className="empty-state"><h3>문제집을 불러오지 못했어요.</h3><p>잠시 후 새로고침해 주세요.</p></div> : assignments.length === 0 ? <div className="empty-state"><h3>아직 추가된 문제집이 없어요.</h3><p>{isOwner ? "위에서 첫 문제집을 추가해 보세요." : "운영자가 문제집을 추가하면 여기에서 바로 풀 수 있어요."}</p></div> : assignments.map((assignment) => <article className="study-assignment-card" key={assignment.version_id}><div><span className="eyebrow">WEEK {assignment.week_number}</span><h3>{assignment.title}</h3><p>{assignment.subject} · {assignment.question_count}문제</p></div><Link className="button-link" href={`/quiz/${assignment.version_id}?groupId=${groupId}`}>풀기</Link></article>)}</div>
    </div>}

    {activeTab === "members" && <div className="panel stack"><h2>멤버</h2>{members.map((member) => <div className="member-row" key={member.user_id}><div><strong>{profileMap.get(member.user_id) ?? "멤버"}</strong><small>{member.role === "owner" ? "운영자" : "멤버"}</small></div>{isOwner && member.role !== "owner" && <RemoveMemberButton groupId={groupId} userId={member.user_id} />}</div>)}</div>}

    {activeTab === "history" && <div className="panel stack"><h2>학습 기록</h2>{attempts.length === 0 ? <p className="muted">아직 이 스터디에서 완료한 풀이가 없어요.</p> : attempts.map((attempt) => <div className="list-row" key={attempt.id}><span><strong>{profileMap.get(attempt.user_id) ?? "멤버"}</strong><small>{attempt.question_set_versions.question_sets.title} · {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString("ko-KR") : "진행 중"}</small></span><strong>{attempt.submitted_at ? `${attempt.score ?? 0} / ${attempt.total}` : "진행 중"}</strong></div>)}</div>}

    {activeTab === "settings" && <div className="panel stack"><h2>스터디 설정</h2><GroupActions groupId={groupId} groupName={group.name} inviteCode={group.invite_code} isOwner={isOwner} /></div>}
  </section>;
}
