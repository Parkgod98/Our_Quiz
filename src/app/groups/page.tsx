import { GroupManager, type Assignment, type GroupOption, type VersionOption } from "@/components/group-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type MembershipRow = { group_id: string; role: string; study_groups: { id: string; name: string; invite_code: string } };
type SetRow = { title: string; question_set_versions: Array<{ id: string; version_number: number; question_count: number }> };
type AssignmentRow = { group_id: string; version_id: string; question_set_versions: { version_number: number; question_sets: { title: string } } };

export default async function GroupsPage() {
  if (!isSupabaseConfigured()) return <section className="stack"><div><span className="eyebrow">STUDY GROUP</span><h1>같은 Version을 함께 풀기</h1><p>Supabase 연결 후 그룹 생성, 초대 코드 참여, Version 배정이 활성화됩니다.</p></div><GroupManager groups={[]} versions={[]} assignments={[]} /></section>;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <section className="narrow panel"><h1>로그인이 필요합니다.</h1><p>그룹 기능은 로그인 후 사용할 수 있습니다.</p></section>;

  const [membershipResult, setResult, assignmentResult] = await Promise.all([
    supabase.from("group_members").select("group_id,role,study_groups!inner(id,name,invite_code)").eq("user_id", userData.user.id),
    supabase.from("question_sets").select("title,question_set_versions(id,version_number,question_count)").eq("owner_id", userData.user.id),
    supabase.from("group_question_sets").select("group_id,version_id,question_set_versions!inner(version_number,question_sets!inner(title))"),
  ]);

  const memberships = (membershipResult.data ?? []) as unknown as MembershipRow[];
  const sets = (setResult.data ?? []) as unknown as SetRow[];
  const assignmentRows = (assignmentResult.data ?? []) as unknown as AssignmentRow[];
  const groups: GroupOption[] = memberships.map((item) => ({ id: item.group_id, name: item.study_groups.name, inviteCode: item.study_groups.invite_code, isOwner: item.role === "owner" }));
  const groupIds = new Set(groups.map((group) => group.id));
  const versions: VersionOption[] = sets.flatMap((set) => set.question_set_versions.map((version) => ({ id: version.id, label: `${set.title} · v${version.version_number} · ${version.question_count}문제` })));
  const assignments: Assignment[] = assignmentRows.filter((item) => groupIds.has(item.group_id)).map((item) => ({ groupId: item.group_id, versionId: item.version_id, label: `${item.question_set_versions.question_sets.title} · v${item.question_set_versions.version_number}` }));

  return <section className="stack"><div><span className="eyebrow">STUDY GROUP</span><h1>같은 Version을 함께 풀기</h1><p>Owner가 Version을 그룹에 배정하면 모든 멤버가 동일한 Snapshot을 Start합니다.</p></div><GroupManager groups={groups} versions={versions} assignments={assignments} /></section>;
}
