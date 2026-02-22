"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Book = {
  id: string;
  title: string;
  author: string;
  is_borrowed: boolean;
  borrowed_by: string | null;
  borrowed_at: string | null;

  ai_summary?: string | null;
  ai_tags?: string[] | null;
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"admin" | "librarian" | "member">("member");

  const [aiSummary, setAiSummary] = useState("");
  const [aiTags, setAiTags] = useState<string[]>([]);

  async function generateAI() {
    setMsg(null);

    if (!title.trim() || !author.trim()) {
      setMsg("Enter title and author first.");
      return;
    }

    const res = await fetch("/api/ai/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), author: author.trim() }),
    });

    const text = await res.text();
    let data: { ai_summary?: string; ai_tags?: string[]; error?: string; note?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || "AI API returned empty response" };
    }

    if (data.error) setMsg(data.error);
    else {
      setAiSummary(data.ai_summary || "");
      setAiTags(data.ai_tags || []);
      // optional: show a note if fallback AI was used
      if (data.note) setMsg(data.note);
    }
  }

  async function loadRole() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setRole("member");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!error && data?.role) {
      setRole((String(data.role).toLowerCase() as "admin" | "librarian" | "member") || "member");
    }
  }

  async function loadBooks() {
    setMsg(null);

    const { data, error } = await supabase
      .from("books")
      .select(
        "id,title,author,is_borrowed,borrowed_by,borrowed_at,ai_summary,ai_tags,created_at"
      )
      .order("created_at", { ascending: false });

    if (error) setMsg(error.message);
    else setBooks((data as Book[]) ?? []);
  }

  async function addBook() {
    setMsg(null);

    if (!title.trim() || !author.trim()) {
      setMsg("Title and author are required.");
      return;
    }

    const { error } = await supabase.from("books").insert({
      title: title.trim(),
      author: author.trim(),
      ai_summary: aiSummary,
      ai_tags: aiTags,
    });

    if (error) setMsg(error.message);
    else {
      setTitle("");
      setAuthor("");
      setAiSummary("");
      setAiTags([]);
      await loadBooks();
    }
  }

  async function deleteBook(id: string) {
    setMsg(null);

    const { error } = await supabase.from("books").delete().eq("id", id);

    if (error) setMsg(error.message);
    else await loadBooks();
  }

  async function borrowBook(id: string) {
    setMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setMsg("You must be logged in to borrow a book.");
      return;
    }

    const { error } = await supabase
      .from("books")
      .update({
        is_borrowed: true,
        borrowed_by: userId,
        borrowed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) setMsg(error.message);
    else await loadBooks();
  }

  async function returnBook(id: string) {
    setMsg(null);

    const { error } = await supabase
      .from("books")
      .update({
        is_borrowed: false,
        borrowed_by: null,
        borrowed_at: null,
      })
      .eq("id", id);

    if (error) setMsg(error.message);
    else await loadBooks();
  }

  useEffect(() => {
    (async () => {
      await loadRole();
      await loadBooks();
    })();
  }, []);

  const filteredBooks = books.filter((b) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
  });

  return (
    <main style={{ padding: 40 }}>
      <h1>📚 Books</h1>

      <p>
        Role: <b>{role}</b>
      </p>

      <p>
        <Link href="/">← Home</Link>
      </p>

      {msg && <p style={{ color: "salmon" }}>{msg}</p>}

      {(role === "admin" || role === "librarian") && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <button onClick={addBook}>Add</button>
          <button onClick={generateAI}>✨ AI Summary</button>
        </div>
      )}

      {aiSummary && (
        <p style={{ marginTop: 10 }}>
          <b>AI Summary:</b> {aiSummary}
        </p>
      )}

      {aiTags.length > 0 && (
        <p>
          <b>AI Tags:</b> {aiTags.join(", ")}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <input
          placeholder="Search by title or author..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 320 }}
        />
      </div>

      <ul style={{ marginTop: 24 }}>
        {filteredBooks.map((b) => (
          <li key={b.id} style={{ marginBottom: 12 }}>
            <b>{b.title}</b> — {b.author}{" "}
            {b.is_borrowed ? "(Borrowed)" : "(Available)"}
            {b.ai_summary && (
              <div style={{ marginTop: 6, maxWidth: 700 }}>
                <small>
                  <b>AI:</b> {b.ai_summary}
                </small>
              </div>
            )}
            {Array.isArray(b.ai_tags) && b.ai_tags.length > 0 && (
              <div>
                <small>
                  <b>Tags:</b> {b.ai_tags.join(", ")}
                </small>
              </div>
            )}
            <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
              {b.is_borrowed ? (
                <button onClick={() => returnBook(b.id)}>Return</button>
              ) : (
                <button onClick={() => borrowBook(b.id)}>Borrow</button>
              )}

              {(role === "admin" || role === "librarian") && (
                <button onClick={() => deleteBook(b.id)}>Delete</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}