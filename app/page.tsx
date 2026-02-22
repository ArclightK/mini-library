"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    location.href = "/login";
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>📚 Mini Library Management System</h1>
<p><a href="/books">📚 Go to Books</a></p>
      {email ? (
        <>
          <p>✅ Signed in as: <b>{email}</b></p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <p>❌ Not signed in</p>
          <a href="/login">Go to login</a>
        </>
      )}
    </main>
  );
}