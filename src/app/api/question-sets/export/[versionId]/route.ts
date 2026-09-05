import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(_request: Request, { params }: { params: Promise<{ versionId: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase가 연결되지 않았습니다." }, { status: 503 });
  const { versionId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("export_question_set", { p_version_id: versionId });
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="question-set-${versionId}.json"` } });
}
