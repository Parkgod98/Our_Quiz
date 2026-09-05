"use client";

import { useState } from "react";
import { validateQuestionSet } from "@/lib/questions/validator";
import type { PortableQuestionSet } from "@/lib/questions/types";

export function ImportPanel({ persistenceEnabled }: { persistenceEnabled: boolean }) {
  const [questionSet, setQuestionSet] = useState<PortableQuestionSet | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  async function onFile(file: File | undefined) {
    setQuestionSet(null);
    setErrors([]);
    setMessage("");
    if (!file) return;
    if (file.size > 2_000_000) {
      setErrors(["파일은 2MB 이하여야 합니다."]);
      return;
    }

    try {
      const parsed: unknown = JSON.parse(await file.text());
      const result = validateQuestionSet(parsed);
      if (!result.success) {
        setErrors(result.errors);
        return;
      }
      setQuestionSet(result.data);
    } catch {
      setErrors(["유효한 JSON 파일이 아닙니다."]);
    }
  }

  async function save() {
    if (!questionSet || !persistenceEnabled) return;
    setMessage("저장 중...");
    const response = await fetch("/api/question-sets/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionSet),
    });
    const payload = (await response.json()) as { message?: string; error?: string };
    setMessage(response.ok ? payload.message ?? "저장했습니다." : payload.error ?? "저장에 실패했습니다.");
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <label className="file-label">Question Set JSON<input type="file" accept="application/json,.json" onChange={(event) => onFile(event.target.files?.[0])} /></label>
        <p className="muted">업로드 즉시 브라우저에서 Schema를 검사합니다. 잘못된 정답 구조는 자동 수정하지 않습니다.</p>
      </div>

      {errors.length > 0 && (
        <div className="panel error-box"><strong>Validation 실패</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>
      )}

      {questionSet && (
        <div className="panel stack">
          <span className="eyebrow">VALID</span>
          <h2>{questionSet.title}</h2>
          <div className="metrics">
            <span>Week {questionSet.week}</span><span>v{questionSet.version}</span><span>{questionSet.questions.length}문제</span>
          </div>
          <p>{questionSet.description}</p>
          <button disabled={!persistenceEnabled} onClick={save}>{persistenceEnabled ? "문제은행에 저장" : "Supabase 연결 후 저장 가능"}</button>
          {message && <p className="notice">{message}</p>}
        </div>
      )}
    </div>
  );
}
