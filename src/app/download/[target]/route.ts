import { latestRelease, RELEASES_URL, TARGETS, type Target } from "@/lib/release";
import { trackServerEvent } from "@/lib/analytics";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ target: string }> },
) {
  const { target } = await params;
  if (!Object.hasOwn(TARGETS, target))
    return new Response("Unknown download", { status: 404 });
  const release = await latestRelease();
  const url = release?.urls[target as Target];
  const os = target === "windows" ? "windows" : target.startsWith("macos-") ? "macos" : "linux";
  await trackServerEvent("download_click", req, { os, target });
  return Response.redirect(url ?? RELEASES_URL, 302);
}
