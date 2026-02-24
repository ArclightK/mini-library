"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    location.href = "/login";
  }

  return (
    <main className="container">
      <div className="card">
        <div className="header">
          <div>
            <h1 className="h1">📚 Mini Library</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              Manage books, borrowing, search, and AI summaries.
            </p>
          </div>

          <div className="badge">
            {loading ? "Checking session..." : email ? "✅ Signed in" : "❌ Not signed in"}
          </div>
        </div>

        <div className="notice" style={{ marginTop: 10 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span className="muted">
              {email ? (
                <>
                  Signed in as <b style={{ color: "var(--text)" }}>{email}</b>
                </>
              ) : (
                <>
                  You are not signed in. Go to <b>Login</b> to continue.
                </>
              )}
            </span>

            <span style={{ marginLeft: "auto" }} />
            {email ? (
              <button className="btn-danger" onClick={logout}>
                Logout
              </button>
            ) : (
              <Link href="/login">
                <button className="btn-primary">Go to Login</button>
              </Link>
            )}
          </div>
        </div>

        <div style={{ marginTop: 18 }} className="row">
          <Link href="/books">
            <button className="btn-primary">📚 Open Books</button>
          </Link>

        </div>

        <div style={{ marginTop: 18 }} className="notice">
          <b>What you can do:</b>
          <ul style={{ margin: "10px 0 0 18px", color: "var(--muted)" }}>
            <li>Add / delete books (admin/librarian)</li>
            <li>Borrow / return books (any signed-in user)</li>
            <li>Search by title or author</li>
            <li>Generate AI summary + tags before adding a book</li>
          </ul>
        </div>
      </div>
    </main>
  );
}