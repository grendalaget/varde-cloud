"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Link } from "@heroui/react";

// Hands a signed-in varde.games session to the desktop app: a fresh token is
// minted per attempt (it only lives ~5 minutes) and handed to the OS
// protocol handler. The token never touches this page's markup.
export function DesktopHandoff({ enabled }: { enabled: boolean }) {
  const [failed, setFailed] = useState(false);

  const openApp = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/desktop-token", { method: "POST" });
      if (!res.ok) throw new Error();
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => void openApp(), 0);
    return () => clearTimeout(t);
  }, [enabled, openApp]);

  return (
    <Card className="w-full max-w-sm">
      <Card.Header>
        <Card.Title>Back to the Varde app</Card.Title>
      </Card.Header>
      <Card.Content className="gap-4">
        {enabled ? (
          <>
            <p className="text-sm text-muted">
              {failed
                ? "That did not work. Try again, or use a code in the app instead."
                : "You are signed in; your browser should ask to open Varde."}
            </p>
            <Button className="w-full" onPress={() => void openApp()}>
              Open Varde
            </Button>
            <p className="text-center text-sm">
              <Link href="/download">No Varde app yet? Get Varde</Link>
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            Desktop sign-in is not available yet. Link your PC from the app
            with a code instead.
          </p>
        )}
      </Card.Content>
    </Card>
  );
}
