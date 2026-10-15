import {
  buttonVariants,
  type ButtonVariants,
} from "@heroui/styles/components/button";
import Link from "next/link";
import type { ReactNode } from "react";

/** A real anchor styled as the mouve Button — works before hydration and
 *  without JS. Internal hrefs go through next/link (client nav + prefetch);
 *  external ones are plain <a>. */
export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  target,
  rel,
  children,
}: {
  href: string;
  variant?: NonNullable<ButtonVariants["variant"]>;
  size?: NonNullable<ButtonVariants["size"]>;
  className?: string;
  target?: string;
  rel?: string;
  children: ReactNode;
}) {
  const cls = buttonVariants({ variant, size, className });
  if (/^https?:\/\//.test(href)) {
    return (
      <a
        href={href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noreferrer" : undefined)}
        className={cls}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} target={target} rel={rel} className={cls}>
      {children}
    </Link>
  );
}
