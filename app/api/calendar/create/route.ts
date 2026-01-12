import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/ai/tools/createCalendarEvent";
import { authOptions } from "@/lib/auth";

async function resolveSession(req: Request) {
  // Try dynamic import of next-auth and getServerSession, otherwise call internal endpoint
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
  const event = body.event;

  if (!event) {
    return NextResponse.json({ error: "Missing event in request body" }, { status: 400 });
  }

  let session: any = null;
  try {
    session = await resolveSession(req);
  } catch (err) {
    console.error("session resolution failed:", err);
  }

  // Accept dev header or env token in development
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

  try {
    const result = await createCalendarEvent(event, session.accessToken, { confirm: true });
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("create event failed:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
