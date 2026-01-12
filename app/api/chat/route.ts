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

  // If we're in development and the explicit canned header was provided,
  // return a deterministic canned streaming response to make testing easier
  // without calling the real model provider. This ensures dev access tokens
  // don't automatically force the canned response.
  const devCanned = req.headers.get("x-dev-canned");
  const devEnv = process.env.DEV_ACCESS_TOKEN;
  if (process.env.NODE_ENV === "development" && devCanned) {
    const encoder = new TextEncoder();
    const chunks = [
      "Here are upcoming sci-fi movies I found and scheduled:\n",
      "- Stellar Drift (2026-05-01) — scheduled: May 3, 2026 at 7:00 PM\n",
      "- Quantum Horizon (2026-06-15) — scheduled: Jun 16, 2026 at 6:30 PM\n",
      "I've added tentative events to your calendar. Below is the proposed event I would create for Stellar Drift if you approve:\n",
      "<<<PROPOSAL\n{\n  \"title\": \"Stellar Drift Screening\",\n  \"description\": \"Screening of Stellar Drift (2026)\",\n  \"startDateTime\": \"2026-05-03T19:00:00\",\n  \"endDateTime\": \"2026-05-03T21:00:00\",\n  \"location\": \"Local Cinema\",\n  \"timeZone\": \"America/New_York\"\n}\n>>>\n",
      "You can approve the proposed event and I'll add it to your calendar.\n",
    ];

    const stream = new ReadableStream({
      start(controller) {
        for (const c of chunks) {
          controller.enqueue(encoder.encode(c));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { messages } = await req.json();

  let result: any;
  try {
    // Log helpful debug info in development
    if (process.env.NODE_ENV === "development") {
      console.debug("[chat] OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
      console.debug("[chat] session access token present:", !!session?.accessToken);
    }

    result = streamText({
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
  } catch (err: any) {
    console.error("[chat] streamText error:", err?.stack ?? err?.message ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

