"use client";

import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Login</h1>
      <button onClick={loginWithGoogle}>Sign in with Google</button>
    </main>
  );
}