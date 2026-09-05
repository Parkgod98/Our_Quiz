import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">Our Quiz</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/import">Import</Link>
        <Link href="/quiz/demo">Demo</Link>
        <Link href="/auth">Login</Link>
      </nav>
    </header>
  );
}
