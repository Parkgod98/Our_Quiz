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
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  return payload;
}

async function signup(label) {
  const payload = await api("/auth/v1/signup", {
    method: "POST",
    body: { email: `${label}-${seed}@example.com`, password: "e2e-password-1234", data: { display_name: label } },
  });
  assert.ok(payload?.access_token);
  assert.ok(payload?.user?.id);
  return { id: payload.user.id, token: payload.access_token };
}

const owner = await signup("shared-owner");
const member = await signup("shared-member");

const groups = await api("/rest/v1/study_groups?select=id,invite_code", {
  method: "POST",
  token: owner.token,
  headers: { Prefer: "return=representation" },
  body: { name: "Shared Assignment Study", created_by: owner.id },
});
const group = groups[0];
await api("/rest/v1/group_members", {
  method: "POST",
  token: owner.token,
  headers: { Prefer: "return=minimal" },
  body: { group_id: group.id, user_id: owner.id, role: "owner" },
});
await api("/rest/v1/rpc/join_group_by_code", {
  method: "POST",
  token: member.token,
  body: { p_code: group.invite_code },
});

const imported = await api("/rest/v1/rpc/import_question_set", {
  method: "POST",
  token: owner.token,
  body: {
    p_payload: {
      schemaVersion: "1.0",
      setId: `shared-${seed}`.replace(/[^a-z0-9-]/g, "-"),
      title: "Shared Assignment Quiz",
      subject: "Semiconductor",
      week: 1,
      version: 1,
      description: "member visibility fixture",
      questions: [{
        id: "q-001",
        type: "true_false",
        topic: "Memory.Basic",
        difficulty: 1,
        prompt: "DRAM은 휘발성 메모리다.",
        answer: true,
        explanation: "DRAM은 전원이 끊기면 데이터가 사라진다.",
      }],
    },
  },
});

await api("/rest/v1/group_question_sets", {
  method: "POST",
  token: owner.token,
  headers: { Prefer: "return=minimal" },
  body: { group_id: group.id, version_id: imported.versionId, assigned_by: owner.id },
});

const memberAssignments = await api("/rest/v1/rpc/get_group_assignments", {
  method: "POST",
  token: member.token,
  body: { p_group_id: group.id },
});
assert.equal(memberAssignments.length, 1, "member should see the problem set assigned by the owner");
assert.equal(memberAssignments[0].version_id, imported.versionId);
assert.equal(memberAssignments[0].title, "Shared Assignment Quiz");

const playable = await api("/rest/v1/rpc/get_playable_question_set", {
  method: "POST",
  token: member.token,
  body: { p_version_id: imported.versionId, p_group_id: group.id },
});
assert.equal(playable.id, imported.versionId, "member should load the assigned version for play");
assert.equal(playable.title, "Shared Assignment Quiz");
assert.equal(playable.questions.length, 1);
assert.equal(playable.questions[0].id, "q-001");
assert.equal("answer" in playable.questions[0], false, "play payload must not expose answers");

const memberStarted = await api("/rest/v1/rpc/start_or_resume_attempt", {
  method: "POST",
  token: member.token,
  body: { p_version_id: imported.versionId, p_group_id: group.id },
});
assert.ok(memberStarted.attemptId, "member should start the assigned quiz");

const ownerStarted = await api("/rest/v1/rpc/start_or_resume_attempt", {
  method: "POST",
  token: owner.token,
  body: { p_version_id: imported.versionId, p_group_id: group.id },
});
assert.ok(ownerStarted.attemptId, "owner should start the assigned quiz");

const memberSubmitted = await api("/rest/v1/rpc/submit_existing_attempt", {
  method: "POST",
  token: member.token,
  body: { p_attempt_id: memberStarted.attemptId, p_responses: { "q-001": false } },
});
assert.equal(memberSubmitted.score, 0);

const ownerSubmitted = await api("/rest/v1/rpc/submit_existing_attempt", {
  method: "POST",
  token: owner.token,
  body: { p_attempt_id: ownerStarted.attemptId, p_responses: { "q-001": true } },
});
assert.equal(ownerSubmitted.score, 1);

const memberResult = await api("/rest/v1/rpc/get_attempt_result", {
  method: "POST",
  token: member.token,
  body: { p_attempt_id: memberStarted.attemptId },
});
assert.equal(memberResult.questions[0].type, "true_false", "result payload should include question type for readable answer comparison");
assert.equal(memberResult.questions[0].correct, false);

const memberHomeAssignments = await api("/rest/v1/rpc/get_my_group_assignments", {
  method: "POST",
  token: member.token,
  body: {},
});
assert.ok(memberHomeAssignments.some((assignment) => assignment.version_id === imported.versionId), "member home should include the shared problem set");

const groupSummaries = await api("/rest/v1/rpc/get_my_group_summaries", {
  method: "POST",
  token: member.token,
  body: {},
});
assert.ok(groupSummaries.some((summary) => summary.id === group.id && Number(summary.assignment_count) === 1));

const dashboard = await api("/rest/v1/rpc/get_dashboard_overview", {
  method: "POST",
  token: member.token,
  body: {},
});
assert.ok(dashboard.assignments.some((assignment) => assignment.versionId === imported.versionId));
assert.ok(dashboard.attempts.some((attempt) => attempt.versionId === imported.versionId));

const memberDetail = await api("/rest/v1/rpc/get_group_detail_overview", {
  method: "POST",
  token: member.token,
  body: { p_group_id: group.id },
});
assert.equal(memberDetail.group.id, group.id);
assert.equal(memberDetail.currentUserId, member.id);
assert.equal(memberDetail.role, "member");
assert.equal(memberDetail.members.length, 2);
assert.ok(memberDetail.members.some((item) => item.userId === member.id));
assert.ok(memberDetail.assignments.some((assignment) => assignment.versionId === imported.versionId));
assert.ok(memberDetail.attempts.some((attempt) => attempt.id === memberStarted.attemptId && Number(attempt.wrongCount) === 1));
assert.ok(memberDetail.attempts.some((attempt) => attempt.id === ownerStarted.attemptId && Number(attempt.wrongCount) === 0), "regular member should see another member's score summary");
assert.deepEqual(memberDetail.versions, [], "regular members should not receive the owner's private library list");

const ownerDetail = await api("/rest/v1/rpc/get_group_detail_overview", {
  method: "POST",
  token: owner.token,
  body: { p_group_id: group.id },
});
assert.equal(ownerDetail.role, "owner");
assert.ok(ownerDetail.versions.some((version) => version.id === imported.versionId));
assert.ok(ownerDetail.attempts.some((attempt) => attempt.id === memberStarted.attemptId && Number(attempt.wrongCount) === 1));

console.log("Shared assignment, shared history summaries and result review payload E2E passed");
