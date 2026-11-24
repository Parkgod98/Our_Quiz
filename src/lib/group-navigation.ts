export type GroupTab = "learning" | "members" | "history" | "settings";

export function groupTab(value: unknown): GroupTab {
  return value === "members" || value === "history" || value === "settings" ? value : "learning";
}

export function groupPath(groupId: unknown, tab: unknown): string | null {
  if (typeof groupId !== "string" || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(groupId)) return null;
  const selected = groupTab(tab);
  return `/groups/${groupId}${selected === "learning" ? "" : `?tab=${selected}`}`;
}
