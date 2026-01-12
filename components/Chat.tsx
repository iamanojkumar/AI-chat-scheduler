"use client";

import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Calendar, Loader2 } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useRef } from "react";

export function Chat() {
  const { data: session, status } = useSession();
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
    });
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                  {message.toolInvocations?.map((toolInvocation) => (
                    <div
                      key={toolInvocation.toolCallId}
                      className="mt-2 text-xs opacity-75"
                    >
                      {toolInvocation.toolName}:{" "}
                      {toolInvocation.state === "result"
                        ? "✓ Completed"
                        : "⏳ Processing..."}
                    </div>
                  ))}
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

