import { EmailLayout, EmailText } from "./layout";

export function PasswordResetEmail({ url }: { url: string }) {
  return (
    <EmailLayout
      preview="Reset your Varde password"
      title="Reset your password"
      url={url}
      ctaLabel="Reset password"
    >
      <EmailText>
        You asked to reset the password for your varde.games account. The link
        is valid for one hour. If you did not ask for this, you can ignore this
        email.
      </EmailText>
    </EmailLayout>
  );
}
