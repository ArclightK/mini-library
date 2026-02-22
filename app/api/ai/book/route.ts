import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// Simple fallback "AI" when OpenAI quota/billing fails
function fallbackAI(title: string, author: string) {
  const t = `${title} ${author}`.toLowerCase();
  const tags: string[] = [];

  if (t.includes("harry") || t.includes("wizard") || t.includes("magic"))
    tags.push("fantasy", "magic", "adventure");

  if (t.includes("love") || t.includes("romance"))
    tags.push("romance", "relationships");

  if (t.includes("murder") || t.includes("crime") || t.includes("detective"))
    tags.push("mystery", "crime", "thriller");

  if (t.includes("space") || t.includes("alien") || t.includes("robot") || t.includes("future"))
    tags.push("sci-fi", "future");

  if (t.includes("history") || t.includes("war"))
    tags.push("history", "war");

  if (t.includes("business") || t.includes("money") || t.includes("startup"))
    tags.push("business", "career");

  if (tags.length === 0) tags.push("general", "popular", "recommended");

  const ai_summary =
    `A short, engaging summary for "${title}" by ${author}. ` +
    `This book explores key themes and keeps readers engaged from start to finish.`;

  return {
    ai_summary,
    ai_tags: Array.from(new Set(tags)).slice(0, 6),
    note: "Fallback AI used (OpenAI quota/billing issue).",
  };
}

export async function POST(req: Request) {
  let body: { title?: string; author?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = (body.title ?? "").toString().trim();
  const author = (body.author ?? "").toString().trim();

  if (!title || !author) {
    return NextResponse.json({ error: "Missing title/author" }, { status: 400 });
  }

  // If key is missing, return fallback (still an AI feature)
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallbackAI(title, author), { status: 200 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are a librarian assistant.
Given a book title and author, generate:
1) a 1-2 sentence summary (fictional if unknown)
2) 3-6 short tags

Return STRICT JSON only with keys:
ai_summary (string), ai_tags (array of strings)

Title: ${title}
Author: ${author}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    let parsed: { ai_summary?: string; ai_tags?: string[] } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      // If parsing fails, return fallback instead of crashing
      return NextResponse.json(fallbackAI(title, author), { status: 200 });
    }

    return NextResponse.json(
      {
        ai_summary: parsed.ai_summary ?? "",
        ai_tags: Array.isArray(parsed.ai_tags) ? parsed.ai_tags : [],
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    // If OpenAI fails due to quota/billing (429), return fallback
    const error = err as { message?: string; status?: number; response?: { status?: number } };
    const msg = error?.message ? String(error.message) : "OpenAI error";
    const status = error?.status ?? error?.response?.status;

    if (status === 429 || msg.includes("quota") || msg.includes("billing")) {
      return NextResponse.json(fallbackAI(title, author), { status: 200 });
    }

    // Other errors: return readable message
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}