"use client";

import { Alert, Button, Card, FieldError, Input, Label, Spinner, TextField } from "@heroui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/next";

const cardClass =
  "vd-pop w-full max-w-sm rounded-2xl border border-separator bg-surface p-7";

// Where the verification link drops the user after better-auth verifies the
// token and signs them in (autoSignInAfterVerification).
const VERIFIED_LANDING = "/account?verified=1";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next") ?? undefined);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  const authHref = (path: string) =>
    next ? `${path}?next=${encodeURIComponent(next)}` : path;
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
        const res = await authClient.signUp.email({
          email,
          password,
          name,
          // better-auth embeds this as the verify link's post-click redirect.
          callbackURL: next ?? VERIFIED_LANDING,
        });
        if (res.error) {
          setError(res.error.message ?? "Could not create your account.");
          return;
        }
        // With requireEmailVerification the sign-up response carries no
        // session; the user must click the emailed link first.
        setVerifyEmail(email);
        return;
      }
      const res = await authClient.signIn.email({
        email,
        password,
        callbackURL: next ?? "/account",
      });
      if (res.error) {
        if (res.error.code === "EMAIL_NOT_VERIFIED") {
          // sendOnSignIn already queued a fresh verification mail.
          setVerifyEmail(email);
          return;
        }
        setError(res.error.message ?? "Sign-in failed.");
        return;
      }
      router.push(next ?? "/account");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (verifyEmail) {
    return <CheckEmailCard email={verifyEmail} callbackURL={next ?? VERIFIED_LANDING} />;
  }

  return (
    <Card className={cardClass}>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {isSignUp
          ? "One account for varde.games. Plans and group features land here."
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
        {isSignUp ? null : (
          <div className="-mt-2 text-right text-sm">
            <Link
              href={authHref("/auth/forgot")}
              className="text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        )}

        {error ? (
          <Alert status="danger" role="alert" className="vd-shake">
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
            <Link
              href={authHref("/auth/sign-in")}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Varde?{" "}
            <Link
              href={authHref("/auth/sign-up")}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}

function CheckEmailCard({
  email,
  callbackURL,
}: {
  email: string;
  callbackURL: string;
}) {
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function resend() {
    setResendError(null);
    setPending(true);
    try {
      const res = await authClient.sendVerificationEmail({ email, callbackURL });
      if (res.error) {
        setResendError(
          res.error.message ?? "Could not send the email. Try again shortly.",
        );
        return;
      }
      // The endpoint answers success either way; the per-account mail
      // cooldown may still suppress the actual send.
      setResent(true);
    } catch {
      setResendError("Could not send the email. Try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className={cardClass}>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Check your email
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        We sent a verification link to{" "}
        <span className="font-medium text-foreground">{email}</span>. Open it to
        confirm your account and sign in. The link is valid for one hour.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {resendError ? (
          <Alert status="danger" role="alert" className="vd-shake">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{resendError}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <Button
          variant="secondary"
          fullWidth
          isPending={pending}
          isDisabled={pending}
          onPress={resend}
        >
          {resent ? "Send it again" : "Resend verification email"}
        </Button>
        {resent && !resendError ? (
          <p className="text-center text-sm text-muted">
            Request sent. We send at most one email every few minutes; check
            your inbox and spam.
          </p>
        ) : null}
        <p className="text-center text-sm text-muted">
          Wrong address?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign up again
          </Link>
        </p>
      </div>
    </Card>
  );
}

export function SignInPending() {
  return <Spinner size="sm" />;
}
