"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  return <button className="nav-account" onClick={async () => {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/");
    router.refresh();
  }}>로그아웃</button>;
}
