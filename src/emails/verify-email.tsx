import { EmailLayout, EmailText } from "./layout";

export function VerifyEmail({ url }: { url: string }) {
  return (
    <EmailLayout
      preview="Verify your Varde email"
      title="Verify your email"
      url={url}
      ctaLabel="Verify email"
    >
      <EmailText>
        Confirm that this address belongs to you to finish setting up your
        varde.games account. The link is valid for one hour. If you did not
        create an account, you can ignore this email.
      </EmailText>
    </EmailLayout>
  );
}
