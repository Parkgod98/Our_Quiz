"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[our-quiz:error]", {
      context: "app.unhandled",
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return <section className="narrow panel stack">
    <h1>화면을 불러오지 못했어요.</h1>
    <p>오류가 기록됐어요. 다시 시도해 주세요.</p>
    <button type="button" onClick={reset}>다시 시도</button>
  </section>;
}
