import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { tools } from "@/lib/ai/tools";
import { authOptions } from "@/lib/auth";
import { createCalendarEvent } from "@/lib/ai/tools/createCalendarEvent";

export async function POST(req: Request) {
  // Resolve session robustly: prefer next-auth's getServerSession if available,
  // otherwise call the internal session endpoint so we don't depend on
  // a particular next-auth export shape at runtime.
  let session: any = null;
  try {
    // Try to import next-auth dynamically and call getServerSession if present
    const nextAuth = await (async () => {
      try {
        return await import("next-auth");
      } catch (e) {
        return null;
      }
    })();

    if (nextAuth && typeof nextAuth.getServerSession === "function") {
      session = await nextAuth.getServerSession(authOptions as any);
    } else {
      // Fallback: call our auth session endpoint and forward cookies.
      const url = new URL("/api/auth/session", process.env.NEXTAUTH_URL ?? "http://localhost:3000").toString();
      const cookie = req.headers.get("cookie") ?? "";
      const res = await fetch(url, { headers: { cookie } });
      if (res.ok) session = await res.json();
    }
  } catch (err) {
    console.error("Failed to resolve session:", err);
  }

  if (!session || !session.accessToken) {
    // Development fallback: accept a dev access token via header or env var
    const devHeader = req.headers.get("x-dev-access-token");
    const devEnv = process.env.DEV_ACCESS_TOKEN;
    if (process.env.NODE_ENV === "development" && (devHeader || devEnv)) {
      session = session || {};
      session.accessToken = devHeader ?? devEnv;
    } else {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    maxSteps: 5,
    tools: {
      searchWeb: tool({
        description: tools.searchWeb.description,
        parameters: tools.searchWeb.parameters,
        execute: async (args) => {
          return await tools.searchWeb.execute(args);
        },
      }),
      getMovieDetails: tool({
        description: tools.getMovieDetails.description,
        parameters: tools.getMovieDetails.parameters,
        execute: async (args) => {
          return await tools.getMovieDetails.execute(args);
        },
      }),
      createCalendarEvent: tool({
        description: tools.createCalendarEvent.description,
        parameters: tools.createCalendarEvent.parameters,
        execute: async (args) => {
          const accessToken = session.accessToken!;
          return await createCalendarEvent(args, accessToken);
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}

