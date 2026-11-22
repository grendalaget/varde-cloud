import { Link as HLink } from "@heroui/react";
import Link from "next/link";
import { Mark } from "./brand";
import { DONATION_URL } from "@/lib/polar";
import { GAME_PAGES, COMPARE_PAGES } from "@/lib/launch-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-separator">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex items-start gap-3">
          <Mark className="h-7 w-7" title="Varde" />
          <div className="text-sm text-muted">
            <p className="font-medium text-foreground">Varde</p>
            <p>Game servers built by many hands.</p>
            <p className="mt-2">
              Open source under{" "}
              <HLink
                href="https://github.com/grendalaget/varde/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-skifer-600 underline-offset-2 hover:text-foreground"
              >
                AGPL-3.0-or-later
              </HLink>
              .
            </p>
            <p className="mt-2">
              <HLink
                href={DONATION_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 underline decoration-skifer-600 underline-offset-2 hover:text-foreground"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 text-glod"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Support the project
              </HLink>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex flex-col gap-2">
            <p className="font-medium text-foreground">Product</p>
            <Link href="/#how-it-works" className="text-muted transition-colors duration-150 hover:text-foreground">
              How it works
            </Link>
            <Link href="/pricing" className="text-muted transition-colors duration-150 hover:text-foreground">
              Pricing
            </Link>
            <Link href="/download" className="text-muted transition-colors duration-150 hover:text-foreground">
              Download
            </Link>
            <Link href="/faq" className="text-muted hover:text-foreground">FAQ</Link>
          </div>
          {[{ title: "Games", pages: GAME_PAGES }, { title: "Compare", pages: COMPARE_PAGES }].map((group) => (
            <div key={group.title} className="flex min-w-0 flex-col gap-2">
              <p className="font-medium text-foreground">{group.title}</p>
              {group.pages.map((page) => (
                <Link key={page.path} href={page.path} className="text-muted hover:text-foreground">
                  {page.linkLabel}
                </Link>
              ))}
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <p className="font-medium text-foreground">Developers</p>
            <HLink
              href="https://github.com/grendalaget/varde"
              target="_blank"
              rel="noreferrer"
              className="text-muted transition-colors duration-150 hover:text-foreground"
            >
              GitHub
            </HLink>
            <HLink
              href="https://github.com/grendalaget/varde/tree/main/docs"
              target="_blank"
              rel="noreferrer"
              className="text-muted transition-colors duration-150 hover:text-foreground"
            >
              Documentation
            </HLink>
            <HLink
              href="https://github.com/grendalaget/varde/releases"
              target="_blank"
              rel="noreferrer"
              className="text-muted transition-colors duration-150 hover:text-foreground"
            >
              Releases
            </HLink>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-foreground">Account</p>
            <a href="mailto:support@varde.games" className="text-muted hover:text-foreground">
              Email support
            </a>
            {process.env.NEXT_PUBLIC_DISCORD_URL ? (
              <a href={process.env.NEXT_PUBLIC_DISCORD_URL} className="text-muted hover:text-foreground">
                Discord
              </a>
            ) : null}
            <Link href="/privacy" className="text-muted hover:text-foreground">Privacy policy</Link>
            <Link href="/terms" className="text-muted hover:text-foreground">Terms of service</Link>
            <Link href="/auth/sign-in" className="text-muted transition-colors duration-150 hover:text-foreground">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="text-muted transition-colors duration-150 hover:text-foreground">
              Create account
            </Link>
            <Link href="/account" className="text-muted transition-colors duration-150 hover:text-foreground">
              Account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
