import Link from "next/link";

const features = [
  ["Portable Question Set", "ChatGPT나 Claude에서 만든 문제를 같은 JSON Schema로 Import/Export합니다."],
  ["Immutable Version", "문제를 보강해도 이전 Attempt의 기준은 바뀌지 않습니다."],
  ["Attempt History", "Start할 때마다 독립된 풀이 기록을 만들고 점수 변화를 누적합니다."],
  ["Topic Analytics", "DRAM.Timing처럼 세부 Topic까지 오답 패턴을 모을 수 있게 설계했습니다."],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <span className="eyebrow">STUDY QUESTION PLATFORM</span>
        <h1>같은 문제를 풀고,<br />틀린 이유까지 함께 쌓는다.</h1>
        <p>문제 생성은 AI에게 맡기되 문제 포맷, Version, 풀이 이력과 권한은 시스템이 보장하는 스터디용 문제은행입니다.</p>
        <div className="row"><Link className="button-link" href="/quiz/demo">Demo 풀어보기</Link><Link className="button-link secondary" href="/import">문제 Import</Link></div>
      </section>

      <section className="feature-grid">
        {features.map(([title, text]) => <article className="panel" key={title}><h2>{title}</h2><p>{text}</p></article>)}
      </section>

      <section className="panel flow-panel">
        <span className="eyebrow">CORE LOOP</span>
        <h2>AI → JSON → Validate → Study → Review → Export</h2>
        <pre>{`ChatGPT / Claude\n      ↓\nquestion-set.json\n      ↓\nImport & Validate\n      ↓\nQuestion Set Version\n      ↓\n각자의 Attempt\n      ↓\n오답 / Topic 통계\n      ↓\nExport 후 AI로 보강`}</pre>
      </section>
    </>
  );
}
