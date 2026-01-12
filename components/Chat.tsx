"use client";

import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Calendar, Loader2 } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function Chat() {
  const { data: session, status } = useSession();
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: process.env.NODE_ENV === "development" ? "/api/chat/raw-proxy" : "/api/chat",
    });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [approvalState, setApprovalState] = useState<Record<string, { status: "idle" | "creating" | "done" | "error"; result?: any }>>({});

  function extractProposal(toolInvocation: any) {
    // The tool execution return may be placed under different keys depending on SDK
    const candidates = [
      toolInvocation.result,
      toolInvocation.toolResult,
      toolInvocation.output,
      toolInvocation.outputs?.[0],
      toolInvocation,
    ];
    for (const c of candidates) {
      if (!c) continue;
      const obj = typeof c === "string" ? null : c;
      if (!obj) continue;
      // check for the expected calendar event keys
      if (obj.proposal && obj.proposal.title && obj.proposal.startDateTime) return obj.proposal;
      if (obj.title && obj.startDateTime) return obj;
    }
    return null;
  }

  function extractProposalFromContent(content: string) {
    if (!content) return null;
    const m = content.match(/<<<PROPOSAL\n([\s\S]+?)\n>>>/);
    if (!m) return null;
    try {
      return JSON.parse(m[1]);
    } catch (e) {
      return null;
    }
  }

  async function approveEvent(toolCallId: string, proposal: any) {
    setApprovalState((s) => ({ ...s, [toolCallId]: { status: "creating" } }));
    try {
      const res = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ event: proposal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setApprovalState((s) => ({ ...s, [toolCallId]: { status: "done", result: data.result } }));
    } catch (err: any) {
      setApprovalState((s) => ({ ...s, [toolCallId]: { status: "error", result: err?.message || String(err) } }));
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Cal-Explorer AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in with Google to start scheduling events from natural
              language.
            </p>
            <Button
              onClick={async () => {
                try {
                  await signIn("google", { callbackUrl: "/" });
                } catch (error) {
                  console.error("Client-side login trigger failed:", error);
                }
              }}
              className="w-full"
              size="lg"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cal-Explorer AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user?.email}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <Card className="p-8 text-center">
              <CardTitle className="mb-4">Start Exploring</CardTitle>
              <p className="text-muted-foreground">
                Try asking: "Find upcoming sci-fi movies and schedule them"
              </p>
            </Card>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <Card
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.toolInvocations?.map((toolInvocation) => {
                    const proposalFromInvocation = extractProposal(toolInvocation);
                    const proposalFromContent = extractProposalFromContent(message.content || "");
                    const proposal = proposalFromInvocation || proposalFromContent;
                    const state = approvalState[toolInvocation.toolCallId]?.status || "idle";
                    const result = approvalState[toolInvocation.toolCallId]?.result;
                    return (
                      <div key={toolInvocation.toolCallId} className="mt-2 text-xs opacity-75">
                        <div>
                          {toolInvocation.toolName}: {toolInvocation.state === "result" ? "✓ Completed" : "⏳ Processing..."}
                        </div>
                        {proposal && toolInvocation.toolName === "createCalendarEvent" && (
                          <div className="mt-2 p-2 border rounded bg-muted">
                            <div className="text-sm font-medium">Proposed event</div>
                            <div className="text-xs">{proposal.title}</div>
                            <div className="text-xs">{proposal.startDateTime} — {proposal.endDateTime}</div>
                            <div className="text-xs">{proposal.location}</div>
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                size="sm"
                                disabled={state === "creating" || state === "done"}
                                onClick={() => approveEvent(toolInvocation.toolCallId, proposal)}
                              >
                                {state === "creating" ? "Creating..." : state === "done" ? "Created" : "Approve & Create"}
                              </Button>
                              {state === "error" && <div className="text-red-500 text-xs">Error: {result}</div>}
                              {state === "done" && result?.id && (
                                <a className="text-xs text-blue-600" href={result.htmlLink} target="_blank" rel="noreferrer">Open event</a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Card>
                <CardContent className="p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="border-t p-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex gap-2"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Find upcoming sci-fi movies and schedule them..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}

