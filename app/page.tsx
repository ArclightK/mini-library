"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserInfo = {
  email: string | null;
};

export default function HomePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email ?? null;
    setUser(email ? { email } : null);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  useEffect(() => {
    (async () => {
      await loadUser();
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="app-shell">
      <div className="app-bg-orb orb-1" />
      <div className="app-bg-orb orb-2" />
      <div className="app-bg-orb orb-3" />

      <section className="hero-card">
        <div className="hero-top-pill" />

        <div className="hero-header">
          <div>
            <h1 className="hero-title">📚 Mini Library</h1>
            <p className="hero-subtitle">
              Manage books, borrowing, stock, and AI-generated summaries in one place.
            </p>
          </div>

          <div className="hero-badge">
            {loading ? "Checking..." : user ? "✅ Signed in" : "🔒 Guest"}
          </div>
        </div>

        {user ? (
          <>
            <div className="info-card">
              <div>
                <div className="info-label">Signed in as</div>
                <div className="info-value">{user.email}</div>
              </div>

              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>

            <div className="button-row">
              <Link href="/books" className="btn btn-primary">
                📚 Open Books
              </Link>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <h3>📖 Borrowing</h3>
                <p>
                  Borrow and return books with borrower details (name, email, phone).
                </p>
              </div>

              <div className="feature-card">
                <h3>📦 Stock Tracking</h3>
                <p>
                  Track total quantity, available copies, and borrowed copies per title.
                </p>
              </div>

              <div className="feature-card">
                <h3>✨ AI Summaries</h3>
                <p>
                  Generate short AI summaries and tags before adding a book.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="info-card">
              <div>
                <div className="info-label">Authentication</div>
                <div className="info-value">You are not signed in</div>
              </div>

              <Link href="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </div>

            <div className="guest-note">
              <p>
                Sign in first to borrow books and manage library records.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}