// Single source of truth for docs structure. The sidebar, index page, and
// sitemap all read this — add a page by appending one entry here.

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
