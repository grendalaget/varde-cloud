import { Suspense } from "react";
import { redirect } from "next/navigation";
import { federationSecret } from "@/lib/federation";
import { getServerSession } from "@/lib/session";
import { DesktopHandoff } from "./desktop-handoff";

async function DesktopAuthContent() {
  const session = await getServerSession();
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
