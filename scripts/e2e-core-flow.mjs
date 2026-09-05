import assert from "node:assert/strict";

const url = process.env.E2E_SUPABASE_URL;
const anonKey = process.env.E2E_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error("E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY are required");

const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function api(path, { method = "GET", token = anonKey, body, headers = {} } = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
  }
  return payload;
}

async function signup(label) {
  const email = `${label}-${seed}@example.com`;
  const payload = await api("/auth/v1/signup", {
    method: "POST",
    body: { email, password: "e2e-password-1234", data: { display_name: label } },
  });
  assert.ok(payload?.access_token, `${label} should receive a session immediately`);
  assert.ok(payload?.user?.id, `${label} should have a user id`);
  return { id: payload.user.id, token: payload.access_token, email };
}

const userA = await signup("user-a");
const userB = await signup("user-b");

const groups = await api("/rest/v1/study_groups?select=id,name,invite_code", {
  method: "POST",
  token: userA.token,
  headers: { Prefer: "return=representation" },
  body: { name: "E2E Semiconductor Study", created_by: userA.id },
});
assert.equal(groups.length, 1);
const group = groups[0];
assert.ok(group.id && group.invite_code);

await api("/rest/v1/group_members", {
  method: "POST",
  token: userA.token,
  headers: { Prefer: "return=minimal" },
  body: { group_id: group.id, user_id: userA.id, role: "owner" },
});

const joinedGroupId = await api("/rest/v1/rpc/join_group_by_code", {
  method: "POST",
  token: userB.token,
  body: { p_code: group.invite_code },
});
assert.equal(joinedGroupId, group.id, "invite code should join the same study group");

const questionSet = {
  schemaVersion: "1.0",
  setId: `e2e-core-${seed}`.replace(/[^a-z0-9-]/g, "-"),
  title: "E2E Core Quiz",
  subject: "Semiconductor",
  week: 1,
  version: 1,
  description: "Core flow integration fixture",
  questions: [
    {
      id: "q-001",
      type: "single_choice",
      topic: "DRAM.Refresh",
      difficulty: 2,
      prompt: "DRAM에 Refresh가 필요한 이유는?",
      choices: [
        { id: "a", text: "Capacitor 전하가 누설되기 때문에" },
        { id: "b", text: "NAND Block을 지워야 하기 때문에" },
      ],
      answer: "a",
      explanation: "DRAM Cell의 전하는 시간이 지나며 누설되므로 주기적인 Refresh가 필요하다.",
    },
    {
      id: "q-002",
      type: "true_false",
      topic: "Memory.Volatility",
      difficulty: 1,
      prompt: "SRAM은 비휘발성 메모리다.",
      answer: false,
      explanation: "SRAM도 전원이 끊기면 데이터가 사라지는 휘발성 메모리다.",
    },
    {
      id: "q-003",
      type: "short_answer",
      topic: "DRAM.Timing",
      difficulty: 2,
      prompt: "ACTIVATE 후 READ/WRITE까지의 대표 Timing은?",
      answer: ["tRCD", "trcd"],
      explanation: "tRCD는 Row 활성화 후 Column 명령이 가능해질 때까지의 지연이다.",
    },
  ],
};

const imported = await api("/rest/v1/rpc/import_question_set", {
  method: "POST",
  token: userA.token,
  body: { p_payload: questionSet },
});
assert.equal(imported.questionCount, 3);
assert.ok(imported.versionId);

await api("/rest/v1/group_question_sets", {
  method: "POST",
  token: userA.token,
  headers: { Prefer: "return=minimal" },
  body: { group_id: group.id, version_id: imported.versionId, assigned_by: userA.id },
});

async function start(token) {
  return api("/rest/v1/rpc/start_or_resume_attempt", {
    method: "POST",
    token,
    body: { p_version_id: imported.versionId, p_group_id: group.id },
  });
}

const attemptA = await start(userA.token);
const attemptB = await start(userB.token);
assert.ok(attemptA.attemptId && attemptB.attemptId);
assert.notEqual(attemptA.attemptId, attemptB.attemptId);

await api("/rest/v1/rpc/save_attempt_response", {
  method: "POST",
  token: userA.token,
  body: { p_attempt_id: attemptA.attemptId, p_question_key: "q-001", p_response: "b" },
});
await api("/rest/v1/rpc/set_attempt_flag", {
  method: "POST",
  token: userA.token,
  body: { p_attempt_id: attemptA.attemptId, p_question_key: "q-001", p_flagged: true },
});

const resumedA = await start(userA.token);
assert.equal(resumedA.attemptId, attemptA.attemptId, "unfinished attempt should resume instead of creating another attempt");
assert.equal(resumedA.responses["q-001"], "b", "saved response should be restored");
assert.ok(resumedA.flaggedQuestionIds.includes("q-001"), "flagged question should be restored");

const resultA = await api("/rest/v1/rpc/submit_existing_attempt", {
  method: "POST",
  token: userA.token,
  body: { p_attempt_id: attemptA.attemptId, p_responses: { "q-001": "b", "q-002": false, "q-003": "tRCD" } },
});
assert.equal(resultA.score, 2);
assert.equal(resultA.total, 3);

const resultB = await api("/rest/v1/rpc/submit_existing_attempt", {
  method: "POST",
  token: userB.token,
  body: { p_attempt_id: attemptB.attemptId, p_responses: { "q-001": "a", "q-002": false, "q-003": "trcd" } },
});
assert.equal(resultB.score, 3);

const detailA = await api("/rest/v1/rpc/get_attempt_result", {
  method: "POST",
  token: userA.token,
  body: { p_attempt_id: attemptA.attemptId },
});
assert.equal(detailA.groupId, group.id, "attempt should preserve study group context");
assert.equal(detailA.questions.length, 3);
assert.equal(detailA.questions.filter((question) => question.correct === false).length, 1);

const reviews = await api("/rest/v1/rpc/get_review_items", {
  method: "POST",
  token: userA.token,
  body: {},
});
assert.equal(reviews.length, 1, "wrong question should appear in review items");
assert.equal(reviews[0].questionKey, "q-001");
assert.equal(reviews[0].wrongCount, 1);

const reviewGrade = await api("/rest/v1/rpc/grade_review_answers", {
  method: "POST",
  token: userA.token,
  body: { p_responses: { [reviews[0].questionId]: "a" } },
});
assert.equal(reviewGrade.length, 1);
assert.equal(reviewGrade[0].correct, true, "review answer should be server-graded against the private answer");

const groupAttempts = await api(`/rest/v1/attempts?select=id,user_id,group_id,score,total,submitted_at&group_id=eq.${group.id}`, {
  token: userA.token,
});
assert.equal(groupAttempts.length, 2, "group members should be able to see shared attempt summary records");
assert.ok(groupAttempts.every((attempt) => attempt.group_id === group.id));

console.log("Core E2E flow passed:");
console.log("- immediate signup sessions for two users");
console.log("- group create/join");
console.log("- question import and group assignment");
console.log("- start/resume/autosaved response and flag");
console.log("- server-side submit and group context");
console.log("- result retrieval and wrong-answer review grading");
