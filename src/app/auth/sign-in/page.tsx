import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm, SignInPending } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense fallback={<SignInPending />}>
        <AuthForm mode="sign-in" />
      </Suspense>
    </main>
  );
}
