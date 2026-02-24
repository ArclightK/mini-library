"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type BookRow = {
  id: string;
  title: string;
  author: string;
  is_borrowed: boolean;
  borrowed_by: string | null;
  borrowed_at: string | null;
  ai_summary?: string | null;
  ai_tags?: string[] | null;
  created_at?: string;
  total_quantity?: number | null;
  available_quantity?: number | null;
};

type BorrowerProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type Book = BookRow & {
  borrowerProfile?: BorrowerProfile | null;
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [role, setRole] = useState<"admin" | "librarian" | "member">("member");

  const [borrowFullName, setBorrowFullName] = useState("");
  const [borrowEmail, setBorrowEmail] = useState("");
  const [borrowPhone, setBorrowPhone] = useState("");

  const [aiSummary, setAiSummary] = useState("");
  const [aiTags, setAiTags] = useState<string[]>([]);

  async function generateAI() {
    setMsg(null);

    if (!title.trim() || !author.trim()) {
      setMsg("Enter title and author first.");
      return;
    }

    try {
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

      if (data.error) {
        setMsg(data.error);
      } else {
        setAiSummary(data.ai_summary || "");
        setAiTags(Array.isArray(data.ai_tags) ? data.ai_tags : []);
        if (data.note) setMsg(data.note);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "AI request failed");
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
      const r = String(data.role).toLowerCase();
      if (r === "admin" || r === "librarian" || r === "member") {
        setRole(r);
      } else {
        setRole("member");
      }
    }
  }

  async function loadBooks() {
    setMsg(null);

    const { data: booksData, error: booksError } = await supabase
      .from("books")
      .select(
        "id,title,author,is_borrowed,borrowed_by,borrowed_at,ai_summary,ai_tags,created_at,total_quantity,available_quantity"
      )
      .order("created_at", { ascending: false });

    if (booksError) {
      setMsg(booksError.message);
      return;
    }

    const rawBooks = (booksData as BookRow[]) ?? [];

    const borrowerIds = Array.from(
      new Set(rawBooks.map((b) => b.borrowed_by).filter(Boolean))
    ) as string[];

    let profilesMap = new Map<string, BorrowerProfile>();

    if (borrowerIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone")
        .in("id", borrowerIds);

      if (profilesError) {
        setMsg(profilesError.message);
      } else {
        profilesMap = new Map(
          ((profilesData as BorrowerProfile[]) ?? []).map((p) => [p.id, p])
        );
      }
    }

    const merged: Book[] = rawBooks.map((b) => ({
      ...b,
      borrowerProfile: b.borrowed_by ? profilesMap.get(b.borrowed_by) ?? null : null,
    }));

    setBooks(merged);
  }

  async function addBook() {
    setMsg(null);

    if (!title.trim() || !author.trim()) {
      setMsg("Title and author are required.");
      return;
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      setMsg("Quantity must be at least 1.");
      return;
    }

    const { error } = await supabase.from("books").insert({
      title: title.trim(),
      author: author.trim(),
      ai_summary: aiSummary || null,
      ai_tags: aiTags.length ? aiTags : null,
      total_quantity: qty,
      available_quantity: qty,
      is_borrowed: false,
      borrowed_by: null,
      borrowed_at: null,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setTitle("");
    setAuthor("");
    setQuantity("1");
    setAiSummary("");
    setAiTags([]);
    await loadBooks();
  }

  async function deleteBook(id: string) {
    setMsg(null);

    const { error } = await supabase.from("books").delete().eq("id", id);

    if (error) setMsg(error.message);
    else await loadBooks();
  }

  async function borrowBook(book: Book) {
    setMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setMsg("You must be logged in to borrow a book.");
      return;
    }

    if (!borrowFullName.trim() || !borrowEmail.trim() || !borrowPhone.trim()) {
      setMsg("Please enter Full name, Email, and Phone before borrowing.");
      return;
    }

    const currentAvailable = Number(book.available_quantity ?? 0);
    if (currentAvailable <= 0) {
      setMsg("No copies left for this book.");
      return;
    }

    const { error: profileErr } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: borrowFullName.trim(),
        email: borrowEmail.trim(),
        phone: borrowPhone.trim(),
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      setMsg("Profile update failed: " + profileErr.message);
      return;
    }

    const newAvailable = currentAvailable - 1;

    const { error } = await supabase
      .from("books")
      .update({
        is_borrowed: true,
        borrowed_by: userId,
        borrowed_at: new Date().toISOString(),
        available_quantity: newAvailable,
      })
      .eq("id", book.id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setBorrowFullName("");
    setBorrowEmail("");
    setBorrowPhone("");
    await loadBooks();
  }

  async function returnBook(book: Book) {
    setMsg(null);

    const currentAvailable = Number(book.available_quantity ?? 0);
    const totalQty = Number(book.total_quantity ?? 1);
    const nextAvailable = Math.min(currentAvailable + 1, totalQty);

    const { error } = await supabase
      .from("books")
      .update({
        is_borrowed: false,
        borrowed_by: null,
        borrowed_at: null,
        available_quantity: nextAvailable,
      })
      .eq("id", book.id);

    if (error) setMsg(error.message);
    else await loadBooks();
  }

  useEffect(() => {
    (async () => {
      await loadRole();
      await loadBooks();
    })();
  }, []);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }, [books, query]);

  function formatBorrowedAt(v: string | null | undefined) {
    if (!v) return "";
    try {
      return new Date(v).toLocaleString();
    } catch {
      return v;
    }
  }

  return (
    <main className="app-shell">
      <div className="app-bg-orb orb-1" />
      <div className="app-bg-orb orb-2" />
      <div className="app-bg-orb orb-3" />

      <section className="books-shell">
        <div className="hero-top-pill" />

        <div className="books-header">
          <div>
            <h1 className="books-title">📚 Books</h1>
            <p className="books-subtitle">
              Manage books, borrowers, stock, and AI summaries
            </p>
          </div>
          <div className="hero-badge">
            Role: <strong>{role}</strong>
          </div>
        </div>

        <div className="books-homeLinkWrap">
          <Link href="/" className="books-homeLink">
            ← Home
          </Link>
        </div>

        {msg && <div className="ui-alert">{msg}</div>}

        {(role === "admin" || role === "librarian") && (
          <section className="ui-panel">
            <h2 className="section-title">Add a book</h2>

            <div className="books-form-grid">
              <input
                className="ui-input"
                placeholder="Book title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="ui-input"
                placeholder="Author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
              <input
                className="ui-input"
                type="number"
                min={1}
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <div className="inline-actions">
                <button className="btn btn-primary" onClick={addBook}>
                  Add
                </button>
                <button className="btn" onClick={generateAI}>
                  ✨ AI Summary
                </button>
              </div>
            </div>

            {aiSummary && (
              <div className="mini-box">
                <p>
                  <strong>AI Summary:</strong> {aiSummary}
                </p>
                {aiTags.length > 0 && (
                  <div className="tag-wrap">
                    {aiTags.map((tag, i) => (
                      <span key={i} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <section className="ui-panel">
          <h2 className="section-title">Search & Borrower Details</h2>

          <div className="stack">
            <input
              className="ui-input search-input"
              placeholder="Search by title or author..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="borrower-grid">
              <input
                className="ui-input"
                placeholder="Your full name"
                value={borrowFullName}
                onChange={(e) => setBorrowFullName(e.target.value)}
              />
              <input
                className="ui-input"
                placeholder="Your email"
                value={borrowEmail}
                onChange={(e) => setBorrowEmail(e.target.value)}
              />
              <input
                className="ui-input"
                placeholder="Your phone"
                value={borrowPhone}
                onChange={(e) => setBorrowPhone(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="books-list-section">
          {filteredBooks.length === 0 ? (
            <div className="empty-card">No books found.</div>
          ) : (
            <ul className="books-list">
              {filteredBooks.map((b) => {
                const totalQty = Number(b.total_quantity ?? 1);
                const availableQty = Number(
                  b.available_quantity ?? (b.is_borrowed ? 0 : 1)
                );
                const borrowedQty = Math.max(totalQty - availableQty, 0);

                return (
                  <li key={b.id} className="book-card">
                    <div className="book-top">
                      <div>
                        <h3 className="book-title">
                          {b.title} <span>—</span> {b.author}
                        </h3>

                        <div className="chip-row">
                          <span
                            className={`chip ${b.is_borrowed ? "chip-warn" : "chip-ok"}`}
                          >
                            {b.is_borrowed ? "Borrowed" : "Available"}
                          </span>
                          <span className="chip">Total: {totalQty}</span>
                          <span className="chip">Left: {availableQty}</span>
                          <span className="chip">Borrowed: {borrowedQty}</span>
                        </div>
                      </div>
                    </div>

                    {b.is_borrowed && (
                      <div className="borrow-meta">
                        <div>
                          <strong>Borrowed by:</strong>{" "}
                          {b.borrowerProfile?.full_name || "Unknown"}
                        </div>
                        <div className="borrow-meta-row">
                          {b.borrowerProfile?.email && <span>📧 {b.borrowerProfile.email}</span>}
                          {b.borrowerProfile?.phone && <span>📞 {b.borrowerProfile.phone}</span>}
                          {b.borrowed_at && <span>🕒 {formatBorrowedAt(b.borrowed_at)}</span>}
                        </div>
                      </div>
                    )}

                    {b.ai_summary && (
                      <div className="ai-box">
                        <div className="ai-label">AI Summary</div>
                        <p>{b.ai_summary}</p>

                        {Array.isArray(b.ai_tags) && b.ai_tags.length > 0 && (
                          <div className="tag-wrap">
                            {b.ai_tags.map((tag, idx) => (
                              <span key={idx} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="card-actions">
                      {b.is_borrowed ? (
                        <button className="btn btn-primary" onClick={() => returnBook(b)}>
                          Return
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => borrowBook(b)}
                          disabled={availableQty <= 0}
                        >
                          {availableQty <= 0 ? "Out of stock" : "Borrow"}
                        </button>
                      )}

                      {(role === "admin" || role === "librarian") && (
                        <button className="btn btn-danger" onClick={() => deleteBook(b.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}