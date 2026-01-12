"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4" />
          <CardTitle className="text-3xl">Cal-Explorer AI</CardTitle>
          <CardDescription>
            Transform conversational intent into verified calendar entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Sign in with your Google account to start scheduling events from
            natural language.
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

