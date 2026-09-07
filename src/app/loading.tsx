export default function Loading() {
  return <section className="stack page-section" aria-live="polite" aria-busy="true">
    <div className="panel loading-state">
      <strong>불러오는 중...</strong>
    </div>
  </section>;
}
