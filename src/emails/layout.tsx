import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

// mouve dark palette (mirrors globals.css tokens): natt page, skifer-900
// card, glod pill CTA with accent-foreground text, take foreground on
// muted grays.
const colors = {
  natt: "#110c0a",
  card: "#1a1513",
  take: "#fcfcfc",
  glod: "#ff5b1f",
  muted: "#a89f9a",
  faint: "#8b8380",
};

const body: CSSProperties = {
  margin: 0,
  padding: "32px 16px",
  backgroundColor: colors.natt,
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  color: colors.take,
};

const card: CSSProperties = {
  maxWidth: "420px",
  margin: "0 auto",
  backgroundColor: colors.card,
  borderRadius: "16px",
  padding: "32px",
};

// Served from the site itself: same-domain assets keep sender reputation
// consistent and there is no third-party host to depend on. PNG — SVG is
// not rendered by major mail clients (Gmail included).
const LOGO_URL = "https://varde.games/brand/varde-logo-dark.png";

const logo: CSSProperties = {
  display: "block",
  margin: "0 0 20px",
};

const title: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "20px",
  lineHeight: "1.3",
  fontWeight: 700,
  color: colors.take,
};

const prose: CSSProperties = {
  margin: "0 0 24px",
  fontSize: "14px",
  lineHeight: "1.5",
  color: colors.muted,
};

const cta: CSSProperties = {
  display: "inline-block",
  backgroundColor: colors.glod,
  // Accent foreground is near-black on the site (--accent-foreground ≈ natt).
  color: colors.natt,
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
  padding: "12px 24px",
  borderRadius: "32px",
};

const fallback: CSSProperties = {
  margin: "24px 0 0",
  fontSize: "12px",
  lineHeight: "1.5",
  color: colors.faint,
};

const rawLink: CSSProperties = {
  color: colors.glod,
  wordBreak: "break-all",
};

const footer: CSSProperties = {
  margin: "24px 0 0",
  fontSize: "12px",
  lineHeight: "1.5",
  color: colors.faint,
};

export function EmailLayout({
  preview,
  title: heading,
  url,
  ctaLabel,
  children,
}: {
  preview: string;
  title: string;
  url: string;
  ctaLabel: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={card}>
          <Img
            src={LOGO_URL}
            alt="Varde"
            width={110}
            height={34}
            style={logo}
          />
          <Heading as="h1" style={title}>
            {heading}
          </Heading>
          <Section style={prose}>{children}</Section>
          <Button href={url} style={cta}>
            {ctaLabel}
          </Button>
          <Text style={fallback}>
            If the button does nothing, paste this link into your browser:
            <br />
            <Link href={url} style={rawLink}>
              {url}
            </Link>
          </Text>
          <Text style={footer}>varde.games</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailText({ children }: { children: ReactNode }) {
  return <Text style={{ margin: "0 0 12px" }}>{children}</Text>;
}
