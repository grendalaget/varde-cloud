// Transactional email. Resend over HTTPS when RESEND_API_KEY is set; in local
// dev (no key) the link is logged to the server console so the flow is still
// testable end to end. EMAIL_FROM must be a verified Resend sender/domain.

const FROM = process.env.EMAIL_FROM ?? "Varde <hello@varde.games>";

function html(title: string, body: string, cta: string, url: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:32px;background:#f4efed;font-family:system-ui,sans-serif;color:#110c0a">
  <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
    <h1 style="margin:0 0 12px;font-size:20px">${title}</h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#5c5653">${body}</p>
    <a href="${url}" style="display:inline-block;background:#ff5b1f;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:32px">${cta}</a>
    <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#8a827e">If the button does nothing, paste this link into your browser:<br><a href="${url}" style="color:#ff5b1f;word-break:break-all">${url}</a></p>
  </div>
</body></html>`;
}

async function send(to: string, subject: string, body: string, link?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // The dev fallback prints the actionable link so flows stay testable
    // without a key — but only outside production, where a reset link must
    // never land in logs.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email] RESEND_API_KEY unset; would mail ${to}: ${link ?? subject}`);
    } else {
      console.error(`[email] RESEND_API_KEY unset; cannot deliver mail to ${to}`);
    }
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html: body }),
  });
  if (!res.ok) {
    console.error(`[email] Resend failed (${res.status}): ${await res.text()}`);
  }
}

export function sendPasswordResetEmail(to: string, url: string) {
  return send(
    to,
    "Reset your Varde password",
    html(
      "Reset your password",
      "You asked to reset the password for your varde.games account. The link is valid for one hour. If you did not ask for this, ignore this email.",
      "Reset password",
      url,
    ),
    url,
  );
}
