import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Export dynamic to keep App Router behavior
export const dynamic = "force-dynamic";

// Initialize NextAuth and export GET/POST handlers in a way that
// supports both shapes returned by NextAuth across versions.
const nextAuthInstance = NextAuth(authOptions as any);

// Try to resolve handlers in multiple shapes (v4 and v5+)
const handlerGet = nextAuthInstance?.handlers?.GET ?? nextAuthInstance?.GET ?? nextAuthInstance;
const handlerPost = nextAuthInstance?.handlers?.POST ?? nextAuthInstance?.POST ?? nextAuthInstance;

export async function GET(request: Request) {
  if (typeof handlerGet !== "function") {
    console.error("NextAuth GET handler is not a function", handlerGet);
    return new Response(JSON.stringify({ error: "Auth handler not available" }), { status: 500 });
  }
  try {
    return await handlerGet(request);
  } catch (err: any) {
    console.error("NextAuth GET error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500 });
  }
}

export async function POST(request: Request) {
  if (typeof handlerPost !== "function") {
    console.error("NextAuth POST handler is not a function", handlerPost);
    return new Response(JSON.stringify({ error: "Auth handler not available" }), { status: 500 });
  }
  try {
    return await handlerPost(request);
  } catch (err: any) {
    console.error("NextAuth POST error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500 });
  }
}

