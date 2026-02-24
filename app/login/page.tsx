"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function signUpWithEmail() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Account created. Check your email if confirmation is enabled.");
  }

  async function signInWithGoogle() {
    setMsg(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setMsg(error.message);
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="login-top-glow" />

        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to access your Mini Library</p>

        {msg && <p className="login-msg">{msg}</p>}

        <form onSubmit={signInWithEmail} className="login-form">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />

          <button type="submit" className="login-btn primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* GOOGLE BUTTON */}
        <button
          type="button"
          onClick={signInWithGoogle}
          className="login-btn google"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={signUpWithEmail}
          className="login-btn ghost"
          disabled={loading}
          style={{ marginTop: 10 }}
        >
          Create account
        </button>

        <div className="login-links">
          <Link href="/">← Back to Home</Link>
        </div>
      </div>
    </main>
  );
}