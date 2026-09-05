"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { validateQuestionSet } from "@/lib/questions/validator";
import type { PortableQuestionSet } from "@/lib/questions/types";

export function ImportPanel({ persistenceEnabled }: { persistenceEnabled: boolean }) {
  const router = useRouter();
  const [questionSet, setQuestionSet] = useState<PortableQuestionSet | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function onFile(file: File | undefined) {
    setQuestionSet(null);
    setErrors([]);
    setMessage("");
    setDragging(false);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") return setErrors(["JSON 파일만 추가할 수 있어요."]);
    if (file.size > 2_000_000) return setErrors(["파일 크기는 2MB 이하여야 해요."]);
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const result = validateQuestionSet(parsed);
      if (!result.success) return setErrors(result.errors);
      setQuestionSet(result.data);
    } catch {
      setErrors(["JSON 파일을 읽을 수 없어요. 파일 내용을 확인해 주세요."]);
    }
  }

  async function save() {
    if (!questionSet || !persistenceEnabled) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/question-sets/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(questionSet) });
    const payload = (await response.json()) as { message?: string; error?: string };
    setSaving(false);
    if (!response.ok) return setMessage(payload.error ?? "문제집을 추가하지 못했어요.");
    setMessage("문제집에 추가했어요.");
    router.refresh();
  }

  return <div className="stack">
    <label
      className="upload-card"
      style={dragging ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : undefined}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setDragging(true); }}
      onDragLeave={(event) => {
        event.preventDefault();
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) setDragging(false);
      }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); void onFile(event.dataTransfer.files?.[0]); }}
    >
      <span className="upload-icon">↑</span>
      <strong>{dragging ? "여기에 놓아주세요" : "JSON 파일 선택 또는 드래그"}</strong>
      <span>클릭해서 선택하거나 파일을 끌어다 놓으세요. 최대 2MB</span>
      <input type="file" accept="application/json,.json" onChange={(event) => void onFile(event.target.files?.[0])} />
    </label>

    {errors.length > 0 && <div className="panel error-box"><strong>파일을 확인해 주세요.</strong><ul>{errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>{errors.length > 8 && <p>외 {errors.length - 8}개의 항목이 더 있어요.</p>}</div>}

    {questionSet && <div className="import-preview panel stack">
      <div className="row spread"><div><span className="eyebrow">추가할 문제집</span><h2>{questionSet.title}</h2></div><span className="valid-badge">파일 확인 완료</span></div>
      <p>{questionSet.description}</p>
      <div className="metrics"><span>Week {questionSet.week}</span><span>버전 {questionSet.version}</span><span>{questionSet.questions.length}문제</span></div>
      <div className="row"><button disabled={!persistenceEnabled || saving} onClick={() => void save()}>{saving ? "추가 중..." : "문제집에 추가"}</button><button className="secondary" onClick={() => { setQuestionSet(null); setErrors([]); setMessage(""); }}>다른 파일 선택</button></div>
      {!persistenceEnabled && <p className="form-message">지금은 저장 기능을 사용할 수 없어요.</p>}
      {message && <p className="notice">{message}</p>}
    </div>}
  </div>;
}
