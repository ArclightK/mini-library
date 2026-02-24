# 📚 Mini Library Management System (AI-Powered)

A beginner-friendly **Mini Library Management System** built with **Next.js + Supabase + OpenAI**.

This project allows users to:
- Manage books (add / delete)
- Borrow and return books
- Track stock (total copies / available copies)
- Save borrower details (full name, email, phone)
- Generate AI book summaries and tags
- Use authentication with different roles (`admin`, `librarian`, `member`)

---

## ✨ Features

### ✅ Book Management
- Add new books (title, author, quantity)
- Delete books (admin / librarian)
- Search books by title or author

### ✅ Borrow / Return System
- Borrow a book (decreases available stock)
- Return a book (increases available stock)
- Stores borrower info:
  - Full name
  - Email
  - Phone number
  - Borrow date/time

### ✅ Stock Tracking
- Set how many copies exist for each title
- See:
  - **Total**
  - **Available**
  - **Borrowed**

### ✅ AI Feature
- Generate AI summary + tags before adding a book
- Uses OpenAI API

### ✅ Authentication + Roles
- Supabase Auth (email/password)
- Role-based behavior:
  - **Admin**
  - **Librarian**
  - **Member**

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript
- **Backend / DB / Auth:** Supabase
- **AI:** OpenAI API
- **Deployment:** Vercel

---

## 📂 Project Structure

- `app/page.tsx` → Home page
- `app/login/page.tsx` → Login / Sign up page
- `app/books/page.tsx` → Books page (main app logic)
- `app/api/ai/book/route.ts` → AI summary API route
- `app/globals.css` → Full project styling
- `lib/supabaseClient.ts` → Supabase client setup

---

## ⚙️ How to Run Locally

### 1) Clone the project
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME