"use client";

import { Alert, Button, Card, FieldError, Input, Label, TextField } from "@heroui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/next";

const cardClass =
  "vd-pop w-full max-w-sm rounded-2xl border border-separator bg-surface p-7";

export function ForgotForm() {
  const next = safeNext(useSearchParams().get("next") ?? undefined);
  const signInHref = next
    ? `/auth/sign-in?next=${encodeURIComponent(next)}`
    : "/auth/sign-in";
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setPending(true);
    try {
      const res = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset${next ? `?next=${encodeURIComponent(next)}` : ""}`,
      });
      if (res.error) {
        setError(res.error.message ?? "Could not send the reset email.");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className={cardClass}>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Forgot your password?
      </h1>
      {sent ? (
        <>
          <p className="mt-1.5 text-sm text-muted">
            If an account exists for that email, a reset link is on its way.
            It is valid for one hour.
          </p>
          <p className="mt-6 text-center text-sm text-muted">
            <Link
              href={signInHref}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-muted">
            Enter your account email and we will send you a reset link.
          </p>
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <TextField name="email" type="email" isRequired className="w-full">
              <Label>Email</Label>
              <Input placeholder="you@example.com" autoComplete="email" />
              <FieldError />
            </TextField>
            {error ? (
              <Alert status="danger" role="alert" className="vd-shake">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}
            <Button type="submit" fullWidth isPending={pending} isDisabled={pending}>
              Send reset link
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            Remembered it?{" "}
            <Link
              href={signInHref}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </Card>
  );
}

export function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const next = safeNext(params.get("next") ?? undefined);
  const signInHref = next
    ? `/auth/sign-in?next=${encodeURIComponent(next)}`
    : "/auth/sign-in";
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const newPassword = String(data.get("password") ?? "");
    if (newPassword !== String(data.get("confirm") ?? "")) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const res = await authClient.resetPassword({ newPassword, token });
      if (res.error) {
        setError(
          res.error.message && res.error.message.length < 120
            ? res.error.message
            : "That reset link is invalid or has expired.",
        );
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className={cardClass}>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Choose a new password
      </h1>
      {!token ? (
        <p className="mt-1.5 text-sm text-muted">
          This link is missing its token. Request a{" "}
          <Link
            href="/auth/forgot"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            new reset link
          </Link>{" "}
          to continue.
        </p>
      ) : done ? (
        <p className="mt-1.5 text-sm text-muted">
          Password updated.{" "}
          <Link
            href={signInHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>{" "}
          with your new password.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <TextField
            name="password"
            type="password"
            isRequired
            className="w-full"
            minLength={8}
          >
            <Label>New password</Label>
            <Input placeholder="8+ characters" autoComplete="new-password" />
            <FieldError />
          </TextField>
          <TextField
            name="confirm"
            type="password"
            isRequired
            className="w-full"
            minLength={8}
          >
            <Label>Confirm password</Label>
            <Input placeholder="Same again" autoComplete="new-password" />
            <FieldError />
          </TextField>
          {error ? (
            <Alert status="danger" role="alert" className="vd-shake">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
          <Button type="submit" fullWidth isPending={pending} isDisabled={pending}>
            Reset password
          </Button>
        </form>
      )}
    </Card>
  );
}
