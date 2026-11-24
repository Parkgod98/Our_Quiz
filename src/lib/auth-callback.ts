export function rootAuthCallback(url: URL): URL | null {
  if (url.pathname !== "/") return null;
  const code = url.searchParams.get("code");
  if (!code && url.searchParams.get("error_code") !== "otp_expired") return null;
  const callback = new URL("/auth/callback", url.origin);
  if (code) callback.searchParams.set("code", code);
  return callback;
}

export function authCallbackDestination(sessionData: object | null) {
  if (!sessionData) return "/auth?expired=1";
  // Supabase returns the flow type from the PKCE verifier stored by this browser.
  return "redirectType" in sessionData && sessionData.redirectType === "recovery"
    ? "/auth?mode=update"
    : "/dashboard";
}
