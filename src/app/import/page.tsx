import { ImportPanel } from "@/components/import-panel";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ImportPage() {
  return <section className="narrow stack"><span className="eyebrow">QUESTION IMPORT</span><h1>문제 세트 가져오기</h1><p>Our Quiz v1 JSON을 올리면 저장 전에 구조와 정답 참조를 검사합니다.</p><ImportPanel persistenceEnabled={isSupabaseConfigured()} /></section>;
}
