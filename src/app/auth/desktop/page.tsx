import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { federationSecret } from "@/lib/federation";
import { DesktopHandoff } from "./desktop-handoff";

async function DesktopAuthContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/sign-in?next=/auth/desktop");
  }
  return <DesktopHandoff enabled={federationSecret() !== null} />;
}

export default function DesktopAuthPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense>
        <DesktopAuthContent />
      </Suspense>
    </main>
  );
}
