import { GroupDirectory, type GroupSummary } from "@/components/group-directory";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type GroupSummaryRow = {
  id: string;
  name: string;
  role: "owner" | "member";
  member_count: number;
  assignment_count: number;
};

export default async function GroupsPage() {
  if (!isSupabaseConfigured()) return <section className="stack"><div><span className="eyebrow">스터디</span><h1>함께 공부할 공간</h1><p>서비스 연결이 완료되면 스터디를 만들고 멤버를 초대할 수 있어요.</p></div></section>;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_my_group_summaries");

  if (error) return <section className="narrow panel"><h1>스터디를 불러오지 못했어요.</h1><p>잠시 후 다시 시도해 주세요.</p></section>;

  const rows = (data ?? []) as GroupSummaryRow[];
  const groups: GroupSummary[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    memberCount: Number(row.member_count),
    assignmentCount: Number(row.assignment_count),
  }));

  return <section className="stack page-section">
    <div className="page-heading"><span className="eyebrow">스터디</span><h1>내 스터디</h1><p>참여 중인 스터디를 확인하고 함께 풀 문제를 관리해 보세요.</p></div>
    <GroupDirectory groups={groups} />
  </section>;
}
