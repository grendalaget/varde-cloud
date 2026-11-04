// Single source of truth for docs structure. The sidebar, index page, and
// sitemap all read this. Append one entry here to add a page.

export type DocsPage = {
  slug: string;
  title: string;
  description: string;
};

export type DocsSection = {
  title: string;
  pages: DocsPage[];
};

export const DOCS_SECTIONS: DocsSection[] = [
  {
    title: "Start here",
    pages: [
      {
        slug: "what-is-varde",
        title: "What is Varde?",
        description:
          "Game servers your whole group keeps alive, explained in five minutes.",
      },
      {
        slug: "join-a-server",
        title: "Join a friend's server",
        description: "Install Varde, link your machine, and start playing.",
      },
      {
        slug: "host-a-server",
        title: "Host a server",
        description:
          "Turn your machine into a server your friends can always reach.",
      },
    ],
  },
  {
    title: "Understand",
    pages: [
      {
        slug: "how-varde-works",
        title: "How Varde works",
        description: "Peers, relays, and the control plane, visualized.",
      },
    ],
  },
  {
    title: "Counter-Strike 2",
    pages: [
      {
        slug: "cs2-server",
        title: "Host a CS2 server",
        description:
          "Set up a free CS2 server on a PC you already own and invite friends.",
      },
      {
        slug: "cs2-server-settings",
        title: "CS2 server settings",
        description:
          "Configure CS2 modes, maps, bots, passwords, and GSLT.",
      },
      {
        slug: "cs2-tournament",
        title: "Host a CS2 tournament",
        description:
          "Run a tournament with Varde, Auto Tournament, and Ready Up.",
      },
    ],
  },
  {
    title: "Plugins",
    pages: [
      {
        slug: "plugins",
        title: "Plugins",
        description:
          "Add group integrations with Varde plugins and configure them safely.",
      },
      {
        slug: "auto-tournament",
        title: "Auto Tournament plugin",
        description:
          "Connect Auto Tournament and Ready Up to a self-hosted Varde group.",
      },
      {
        slug: "build-a-plugin",
        title: "Build a plugin",
        description:
          "Create a Varde plugin with a manifest, signed requests, and pages.",
      },
    ],
  },
  {
    title: "Help",
    pages: [
      {
        slug: "troubleshooting",
        title: "Troubleshooting",
        description: "Install, linking, and connection fixes.",
      },
      {
        slug: "faq",
        title: "FAQ",
        description: "Common questions, short answers.",
      },
      {
        slug: "glossary",
        title: "Glossary",
        description: "Every Varde term in plain words.",
      },
    ],
  },
];

export const ALL_DOCS_PAGES = DOCS_SECTIONS.flatMap((s) => s.pages);
