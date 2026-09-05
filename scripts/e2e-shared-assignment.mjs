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

const memberHomeAssignments = await api("/rest/v1/rpc/get_my_group_assignments", {
  method: "POST",
  token: member.token,
  body: {},
});
assert.ok(memberHomeAssignments.some((assignment) => assignment.version_id === imported.versionId), "member home should include the shared problem set");

console.log("Shared assignment visibility E2E passed");
