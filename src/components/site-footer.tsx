import Link from "next/link";
import { Mark } from "./brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-separator">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Mark className="h-7 w-7" title="Varde" />
          <div className="text-sm text-muted">
            <p className="font-medium text-foreground">Varde</p>
            <p>Game servers built by many hands.</p>
            <p className="mt-2">
              Open source under{" "}
              <a
                href="https://github.com/grendalaget/varde/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-skifer-600 underline-offset-2 hover:text-foreground"
              >
                AGPL-3.0-or-later
              </a>
              .
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="font-medium text-foreground">Product</p>
            <Link href="/#how-it-works" className="text-muted hover:text-foreground">
              How it works
            </Link>
            <Link href="/pricing" className="text-muted hover:text-foreground">
              Pricing
            </Link>
            <Link href="/download" className="text-muted hover:text-foreground">
              Download
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-foreground">Developers</p>
            <a
              href="https://github.com/grendalaget/varde"
              target="_blank"
              rel="noreferrer"
              className="text-muted hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://github.com/grendalaget/varde/tree/main/docs"
              target="_blank"
              rel="noreferrer"
              className="text-muted hover:text-foreground"
            >
              Documentation
            </a>
            <a
              href="https://github.com/grendalaget/varde/releases"
              target="_blank"
              rel="noreferrer"
              className="text-muted hover:text-foreground"
            >
              Releases
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-foreground">Account</p>
            <Link href="/auth/sign-in" className="text-muted hover:text-foreground">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="text-muted hover:text-foreground">
              Create account
            </Link>
            <Link href="/account" className="text-muted hover:text-foreground">
              Account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
