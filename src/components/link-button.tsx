"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/** A mouve Button that navigates like a link: client-side push for
 *  internal hrefs, window.open for external ones. */
export function LinkButton({
  href,
  target,
  ...props
}: {
  href: string;
  target?: string;
} & Omit<ComponentProps<typeof Button>, "onPress">) {
  const router = useRouter();
  const go = () => {
    if (/^https?:\/\//.test(href)) {
      window.open(href, target === "_blank" ? "_blank" : "_self", "noreferrer");
    } else {
      router.push(href);
    }
  };
  return <Button onPress={go} {...props} />;
}
