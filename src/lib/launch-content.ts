import type { Metadata } from "next";

export type LaunchPage = {
  path: string;
  linkLabel: string;
  title: string;
  description: string;
  sections: { title: string; body: string }[];
  source?: { href: string; label: string };
};

export const GAME_PAGES: LaunchPage[] = [
  {
    path: "/minecraft",
    linkLabel: "Minecraft Java",
    title: "Minecraft Java servers with friends",
    description: "Host Minecraft Java on your group's PCs with replicated saves, automatic failover and no port forwarding. Keep control of your server with Varde.",
    sections: [
      { title: "Your server, shared hosting", body: "Varde runs one Minecraft Java server on a member's computer at a time and replicates save snapshots across the group. If the host goes offline, another eligible online computer can take over. Friends reconnect through the same local address without configuring router ports." },
      { title: "Supported hosts", body: "Host on Linux or Windows, on x86_64 or aarch64. macOS cannot host current catalog games. Each player needs Varde running and must be linked to the group for mesh game connections. You still need your own copy of Minecraft Java." },
      { title: "Java, the EULA and saves", body: "The driver provisions Java and the selected Mojang server JAR. You must accept the Minecraft EULA before hosting. Live snapshots coordinate Minecraft's save-off, save-all flush and save-on commands. Failover restores the latest usable replicated snapshot, not the running process, so recent progress can be lost." },
    ],
    source: { href: "https://github.com/grendalaget/varde/tree/main/games/minecraft", label: "Minecraft driver source" },
  },
  {
    path: "/valheim",
    linkLabel: "Valheim",
    title: "Valheim servers that can move with the group",
    description: "Peer-host a Valheim dedicated server on Linux or Windows with Varde. Replicate saves, share hosting and reconnect after failover without port forwarding.",
    sections: [
      { title: "Keep the save with your group", body: "One friend's computer runs the dedicated server while Varde replicates save snapshots to peers. Another eligible online host can restore a replicated snapshot after a failure. The stable local address stays the same, but players may need to reconnect." },
      { title: "Supported hosts and runtime requirements", body: "Valheim hosting supports Linux and Windows x86_64, not macOS. The driver installs SteamCMD app 896660. Linux needs glibc 2.29 or newer and the Valheim runtime libraries, including libatomic1 and libpulse0. Each player needs Varde running for mesh connections and their own copy of the game." },
      { title: "Save intervals and recovery", body: "The save interval defaults to 300 seconds and can be set from 60 to 3600 seconds. Shorter intervals trade more frequent disk writes for less unsaved progress. The driver takes its final snapshot after a clean graceful stop. A hard kill can lose changes since the last game save; failover also depends on which snapshot reached another peer." },
    ],
    source: { href: "https://github.com/grendalaget/varde/tree/main/games/valheim", label: "Valheim driver source" },
  },
  {
    path: "/cs2",
    linkLabel: "Counter-Strike 2",
    title: "Counter-Strike 2 servers on your group's PCs",
    description: "Host CS2 on Linux or Windows with Varde's encrypted mesh, stable local addresses and automatic failover. See install sizes and Linux-only addon limits.",
    sections: [
      { title: "Host matches without opening router ports", body: "Varde routes game traffic over an encrypted peer mesh with relay fallback. One eligible computer hosts the CS2 server at a time. If hosting moves after a failure, players reconnect to the same local server address. This is server recovery, not uninterrupted match migration." },
      { title: "Supported hosts and the first download", body: "CS2 hosting supports Linux and Windows x86_64, not macOS. Varde can reuse a complete Steam app 730 client installation, avoiding a second roughly 69 GB download. Without one, it falls back to SteamCMD with a 75 GB install-space budget. Download size can change with Valve updates. Linux SteamCMD also needs its 32-bit runtime." },
      { title: "Ready Up and persisted state", body: "CS2 server addons, including Ready Up, require a Linux host. Plain CS2 hosting also works on Windows. The base driver snapshots saved ban files, not live match memory, demos or all plugin data. Do not assume every part of a match survives a crash. Each player needs Varde running for normal mesh game connections." },
    ],
    source: { href: "https://github.com/grendalaget/varde/tree/main/games/cs2", label: "CS2 driver source" },
  },
];

const SHARED_TRADEOFF = "Varde is AGPL-licensed open source. You keep your server saves on the group's machines and can self-host the stack. Its mesh uses NAT traversal and relay fallback, so normal play does not require port forwarding. Automatic failover needs another eligible online host and a usable replicated snapshot; it does not preserve live process memory or guarantee zero lost progress.";

export const COMPARE_PAGES: LaunchPage[] = [
  {
    path: "/compare/renting-a-server",
    linkLabel: "Renting a server",
    title: "Varde or renting a game server?",
    description: "Compare peer-hosting with renting a game server: who runs the hardware, who maintains it, how saves recover and what your group needs to stay online.",
    sections: [
      { title: "Where the server runs", body: "Renting a server means paying a provider to run it on their infrastructure. Resources, backups, management and availability depend on the provider and plan. Varde's peer-hosting model instead uses a computer in your group, so your group supplies the hardware, power and internet connection." },
      { title: "What Varde changes", body: SHARED_TRADEOFF },
      { title: "Choose the operating model you want", body: "Renting can suit groups that prefer a provider-operated machine rather than keeping a friend's PC available. Varde suits groups that want to share hosting and control their saves. Normal Varde game connections require every player to run Varde. Optional anchors keep replicated saves available, but are not a promise of always-on game hosting." },
    ],
  },
  {
    path: "/compare/aternos",
    linkLabel: "Aternos",
    title: "Varde and Aternos: two hosting models",
    description: "Aternos hosts Minecraft servers on its infrastructure. Varde peer-hosts on your group's computers. Compare the operating models and recovery tradeoffs.",
    sections: [
      { title: "Hosted Minecraft or peer-hosted servers", body: "Aternos is a Minecraft server hosting service: the game server runs on their machines. With Varde, a member of your group runs the server on their own computer. This is a comparison of hosting models, not a benchmark of Aternos performance, limits or availability." },
      { title: "What Varde offers your group", body: SHARED_TRADEOFF },
      { title: "Different responsibilities", body: "A hosted service can be a better fit if you do not want to supply a host computer. With Varde, your group is responsible for eligible hosts, game requirements and keeping peers online. Everyone needs Varde for normal mesh connections. Minecraft Java hosting works on Linux and Windows, not macOS. Check Aternos directly for its current features and terms." },
    ],
    source: { href: "https://aternos.org/", label: "Aternos official website" },
  },
  {
    path: "/compare/playit-gg",
    linkLabel: "playit.gg",
    title: "Varde and playit.gg: hosting coordination or tunnelling",
    description: "Compare Varde's peer-hosting, save replication and failover with a tunnelling approach to game-server connectivity. Choose the model your group needs.",
    sections: [
      { title: "Start with the problem you need to solve", body: "playit.gg provides tunnelling for reaching a server without configuring port forwarding. A tunnel addresses connectivity to a host. Varde combines private group connectivity with save replication and coordination of which group computer hosts the game. These are different scopes, not interchangeable feature lists." },
      { title: "Beyond reaching one computer", body: SHARED_TRADEOFF },
      { title: "Public access or a group mesh", body: "A tunnelling service may fit when you want people to reach a server you operate. Varde's normal game connections use a local address on each player's computer, so each player needs Varde running and group membership. Varde is not a general public game-server tunnel. Check playit.gg directly for its supported protocols, plans and current terms." },
    ],
    source: { href: "https://playit.gg/", label: "playit.gg official website" },
  },
];

export const FAQ_PAGE: LaunchPage = {
  path: "/faq",
  linkLabel: "FAQ",
  title: "Frequently asked questions",
  description: "Honest Varde limitations: client requirements, supported hosts, Linux-only Ready Up and what snapshot-based failover can recover.",
  sections: [
    { title: "Does every player need Varde running?", body: "Yes for normal mesh game connections. Every player needs the Varde agent and its mesh process running, linked to the group. The stable 127.77.x.y address is local to each computer, not a public internet address. Only one computer hosts the game at a time. A configured public HTTPS gateway can expose Auto Tournament's web interface to browsers without a local client, but is not a public TCP or UDP gateway for every game." },
    { title: "Can macOS host games?", body: "Not the current catalog games. They allow Linux and Windows hosts, with architecture requirements varying by game. A macOS app download does not imply macOS game-hosting support." },
    { title: "Can I run Ready Up on Windows?", body: "Not as a CS2 server addon. Ready Up's CS2 integration and other CS2 game addons require a Linux host. Plain CS2 hosting supports Linux and Windows x86_64." },
    { title: "Does failover preserve every moment of play?", body: "No. Failover restores the latest usable replicated save snapshot, not the running game's memory or network connections. Another eligible host must be online. Players may need to reconnect, and progress since the latest usable snapshot can be lost. Save handling differs by game: Valheim uses a configurable save interval, while the base CS2 driver persists saved ban files rather than live match state." },
  ],
  source: { href: "https://github.com/grendalaget/varde", label: "Core source and technical documentation" },
};

export const LAUNCH_PAGES = [...GAME_PAGES, ...COMPARE_PAGES, FAQ_PAGE];

export function launchMetadata(page: LaunchPage): Metadata {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      title: `${page.title} | Varde`,
      description: page.description,
      url: page.path,
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Varde" }],
    },
    twitter: { card: "summary_large_image", title: `${page.title} | Varde`, description: page.description, images: ["/og.png"] },
  };
}
