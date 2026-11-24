import assert from "node:assert/strict";
import { rootAuthCallback, authCallbackDestination } from "../src/lib/auth-callback.ts";
import { groupPath } from "../src/lib/group-navigation.ts";

const origin = "https://example.test";
const callback = rootAuthCallback(new URL("/?code=sample&source=email", origin));
assert.equal(callback?.href, `${origin}/auth/callback?code=sample`);
assert.equal(rootAuthCallback(new URL("/?error_code=otp_expired", origin))?.pathname, "/auth/callback");
assert.equal(rootAuthCallback(new URL("/", origin)), null);
assert.equal(rootAuthCallback(new URL("/?source=study", origin)), null);
assert.equal(rootAuthCallback(new URL("/groups?code=sample", origin)), null);
assert.equal(authCallbackDestination({ redirectType: "recovery" }), "/auth?mode=update");
assert.equal(authCallbackDestination({ redirectType: null }), "/dashboard");
assert.equal(authCallbackDestination({}), "/dashboard");
assert.equal(authCallbackDestination(null), "/auth?expired=1");

const group = "00000000-0000-4000-8000-000000000001";
assert.equal(groupPath(group, "history"), `/groups/${group}?tab=history`);
assert.equal(groupPath(group, undefined), `/groups/${group}`);
assert.equal(groupPath(group, "other"), `/groups/${group}`);
assert.equal(groupPath("invalid", "members"), null);
console.log("Auth callback and study return navigation passed.");
