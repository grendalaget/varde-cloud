import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInPending } from "@/components/auth-form";
import { ForgotForm } from "@/components/reset-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense fallback={<SignInPending />}>
        <ForgotForm />
      </Suspense>
    </main>
  );
}
