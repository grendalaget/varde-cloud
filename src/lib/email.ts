// Transactional email. Templates are react-email components (src/emails/)
// rendered to HTML + plain text here. Resend over HTTPS when RESEND_API_KEY
// is set; in local dev (no key) the link is logged to the server console so
// the flow is still testable end to end. EMAIL_FROM must be a verified
// Resend sender/domain.

import { render } from "@react-email/components";
import { createElement, type ComponentType } from "react";

import { PasswordResetEmail } from "../emails/password-reset";
import { VerifyEmail } from "../emails/verify-email";

const FROM = process.env.EMAIL_FROM ?? "Varde <hello@varde.games>";

async function send(
  to: string,
  subject: string,
  body: { html: string; text: string },
  link?: string,
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // The dev fallback prints the actionable link so flows stay testable
    // without a key — but only outside production, where a reset link must
    // never land in logs.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email] RESEND_API_KEY unset; would mail ${to}: ${link ?? subject}`);
      return;
    }
    // requireEmailVerification makes mail load-bearing: silently dropping it
    // would strand accounts that can never verify, so fail loudly instead.
    throw new Error("[email] RESEND_API_KEY is required in production");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, ...body }),
  });
  if (!res.ok) {
    console.error(`[email] Resend failed (${res.status}): ${await res.text()}`);
  }
}

async function renderEmail(template: ComponentType<{ url: string }>, url: string) {
  const element = createElement(template, { url });
  return {
    html: await render(element),
    text: await render(element, { plainText: true }),
  };
}

export async function sendPasswordResetEmail(to: string, url: string) {
  const body = await renderEmail(PasswordResetEmail, url);
  return send(to, "Reset your Varde password", body, url);
}

export async function sendVerificationEmail(to: string, url: string) {
  const body = await renderEmail(VerifyEmail, url);
  return send(to, "Verify your Varde email", body, url);
}
