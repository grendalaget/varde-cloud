"use client";

import { Alert, Button, Card, FieldError, Input, Label, Spinner, TextField } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "");

    setPending(true);
    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({ email, password, name });
        if (res.error) {
          setError(res.error.message ?? "Could not create your account.");
          return;
        }
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) {
          setError(res.error.message ?? "Sign-in failed.");
          return;
        }
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm rounded-2xl border border-separator bg-surface p-7">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {isSignUp
          ? "One account for varde.games — plans and group features land here."
          : "Sign in to your varde.games account."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        {isSignUp ? (
          <TextField name="name" isRequired className="w-full">
            <Label>Name</Label>
            <Input placeholder="What should we call you?" autoComplete="name" />
            <FieldError />
          </TextField>
        ) : null}
        <TextField name="email" type="email" isRequired className="w-full">
          <Label>Email</Label>
          <Input placeholder="you@example.com" autoComplete="email" />
          <FieldError />
        </TextField>
        <TextField
          name="password"
          type="password"
          isRequired
          className="w-full"
          minLength={8}
        >
          <Label>Password</Label>
          <Input
            placeholder={isSignUp ? "8+ characters" : "Your password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />
          <FieldError />
        </TextField>

        {error ? (
          <Alert status="danger" role="alert">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <Button type="submit" fullWidth isPending={pending} isDisabled={pending}>
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/auth/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Varde?{" "}
            <Link href="/auth/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}

export function SignInPending() {
  return <Spinner size="sm" />;
}
