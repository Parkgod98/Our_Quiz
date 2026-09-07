import { notFound } from "next/navigation";
import { GroupDetailTabs } from "@/components/group-detail-tabs";
import { logServerError } from "@/lib/server/log-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TabKey = "learning" | "members" | "history" | "settings";

type GroupOverview = Parameters<typeof GroupDetailTabs>[0]["overview"];

const tabKeys = new Set<TabKey>(["learning", "members", "history", "settings"]);

export default async function GroupDetailPage({ params, searchParams }: { params: Promise<{ groupId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ groupId }, { tab }] = await Promise.all([params, searchParams]);
  const initialTab: TabKey = tab && tabKeys.has(tab as TabKey) ? tab as TabKey : "learning";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_group_detail_overview", { p_group_id: groupId });

  if (error) {
    logServerError("groups.detail.load", error, { groupId });
    if (error.message.includes("group access denied") || error.message.includes("group not found") || error.message.includes("authentication required")) notFound();
    return <section className="narrow panel"><h1>스터디를 불러오지 못했어요.</h1><p>오류가 기록됐어요. 잠시 후 다시 시도해 주세요.</p></section>;
  }

  if (!data) {
    logServerError("groups.detail.empty", new Error("group detail RPC returned empty data"), { groupId });
    return <section className="narrow panel"><h1>스터디를 불러오지 못했어요.</h1><p>오류가 기록됐어요. 잠시 후 다시 시도해 주세요.</p></section>;
  }

  return <GroupDetailTabs overview={data as unknown as GroupOverview} initialTab={initialTab} />;
}
