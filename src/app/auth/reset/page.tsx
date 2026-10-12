import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInPending } from "@/components/auth-form";
import { ResetForm } from "@/components/reset-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense fallback={<SignInPending />}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
