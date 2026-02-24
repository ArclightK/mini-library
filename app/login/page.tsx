"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    setMsg(null);

    if (!email.trim() || !password.trim()) {
      setMsg("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setMsg(error.message);
        } else {
          window.location.href = "/";
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setMsg(error.message);
        } else {
          setMsg("Account created. You can now sign in.");
          setMode("login");
        }
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="app-bg-orb orb-1" />
      <div className="app-bg-orb orb-2" />
      <div className="app-bg-orb orb-3" />

      <section className="auth-card">
        <div className="hero-top-pill" />

        <div className="auth-header">
          <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
          <p>
            {mode === "login"
              ? "Sign in to access your Mini Library"
              : "Create a new account to use the library system"}
          </p>
        </div>

        <div className="auth-form">
          <input
            className="ui-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="ui-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {msg && <div className="ui-alert">{msg}</div>}

          <button className="btn btn-primary auth-submit" onClick={handleAuth} disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </div>

        <div className="auth-footer">
          {mode === "login" ? (
            <p>
              Don’t have an account?{" "}
              <button className="link-btn" onClick={() => setMode("signup")}>
                Create one
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button className="link-btn" onClick={() => setMode("login")}>
                Sign in
              </button>
            </p>
          )}

          <Link href="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}