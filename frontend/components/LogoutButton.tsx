"use client";

import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return <button onClick={logout}>Logout</button>;
}