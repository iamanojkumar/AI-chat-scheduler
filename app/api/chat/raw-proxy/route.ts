import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

async function resolveSession(req: Request) {
  try {
    const nextAuth = await (async () => {
      try {
        return await import("next-auth");
      } catch (e) {
        return null;
      }
    })();

    if (nextAuth && typeof (nextAuth as any).getServerSession === "function") {
      return await (nextAuth as any).getServerSession(authOptions as any);
    }
  } catch (err) {
    console.error("resolveSession error:", err);
  }

  try {
    const url = new URL("/api/auth/session", process.env.NEXTAUTH_URL ?? "http://localhost:3000").toString();
    const cookie = req.headers.get("cookie") ?? "";
    const res = await fetch(url, { headers: { cookie } });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error("resolveSession fallback error:", err);
  }

  return null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const messages = body.messages;

  if (!messages) return NextResponse.json({ error: "Missing messages" }, { status: 400 });

  let session: any = null;
  try {
    session = await resolveSession(req);
  } catch (err) {
    console.error("session resolution failed:", err);
  }

  if (!session || !session.accessToken) {
    const devHeader = req.headers.get("x-dev-access-token");
    const devEnv = process.env.DEV_ACCESS_TOKEN;
    if (process.env.NODE_ENV === "development" && (devHeader || devEnv)) {
      session = session || {};
      session.accessToken = devHeader ?? devEnv;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Proxy the request to OpenAI streaming completions
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "gpt-4o", messages, stream: true }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    console.error("OpenAI proxy error:", resp.status, txt);
    return NextResponse.json({ error: "OpenAI request failed", detail: txt }, { status: 500 });
  }

  // Return the streaming response directly to the client
  const headers = new Headers();
  resp.headers.forEach((v, k) => headers.set(k, v));
  return new Response(resp.body, { status: resp.status, headers });
}
