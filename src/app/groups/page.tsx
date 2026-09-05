import Link from "next/link";
import { GroupDirectory, type GroupSummary } from "@/components/group-directory";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type MembershipRow = { group_id: string; role: "owner" | "member"; study_groups: { id: string; name: string } };
type GroupMemberRow = { group_id: string };
type AssignmentRow = { group_id: string };

export default async function GroupsPage() {
  if (!isSupabaseConfigured()) return <section className="stack"><div><span className="eyebrow">스터디</span><h1>함께 공부할 공간</h1><p>서비스 연결이 완료되면 스터디를 만들고 멤버를 초대할 수 있어요.</p></div></section>;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <section className="narrow panel"><h1>로그인이 필요해요.</h1><p>스터디는 로그인 후 이용할 수 있어요.</p><Link className="button-link" href="/auth">로그인하기</Link></section>;

  const membershipResult = await supabase.from("group_members").select("group_id,role,study_groups!inner(id,name)").eq("user_id", userData.user.id).order("joined_at");
  const memberships = (membershipResult.data ?? []) as unknown as MembershipRow[];
  const groupIds = memberships.map((membership) => membership.group_id);

  let memberRows: GroupMemberRow[] = [];
  let assignmentRows: AssignmentRow[] = [];
  if (groupIds.length > 0) {
    const [membersResult, assignmentsResult] = await Promise.all([
      supabase.from("group_members").select("group_id").in("group_id", groupIds),
      supabase.from("group_question_sets").select("group_id").in("group_id", groupIds),
    ]);
    memberRows = (membersResult.data ?? []) as GroupMemberRow[];
    assignmentRows = (assignmentsResult.data ?? []) as AssignmentRow[];
  }

  const groups: GroupSummary[] = memberships.map((membership) => ({
    id: membership.group_id,
    name: membership.study_groups.name,
    role: membership.role,
    memberCount: memberRows.filter((row) => row.group_id === membership.group_id).length,
    assignmentCount: assignmentRows.filter((row) => row.group_id === membership.group_id).length,
  }));

  return <section className="stack page-section">
    <div className="page-heading"><span className="eyebrow">스터디</span><h1>내 스터디</h1><p>참여 중인 스터디를 확인하고 함께 풀 문제를 관리해 보세요.</p></div>
    <GroupDirectory groups={groups} />
  </section>;
}
