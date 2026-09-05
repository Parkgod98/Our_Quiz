import Link from "next/link";
import { ImportPanel } from "@/components/import-panel";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ImportPage() {
  return <section className="narrow stack page-section"><Link className="back-link" href="/library">← 내 문제집</Link><div className="page-heading"><span className="eyebrow">문제집 추가</span><h1>문제 파일 가져오기</h1><p>준비한 JSON 파일을 선택하면 문제 수와 기본 정보를 확인한 뒤 문제집에 추가할 수 있어요.</p></div><ImportPanel persistenceEnabled={isSupabaseConfigured()} /></section>;
}
