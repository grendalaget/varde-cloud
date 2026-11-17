import { latestRelease, RELEASES_URL, TARGETS, type Target } from "@/lib/release";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ target: string }> },
) {
  const { target } = await params;
  if (!(target in TARGETS))
    return new Response("Unknown download", { status: 404 });
  const release = await latestRelease();
  const url = release?.urls[target as Target];
  return Response.redirect(url ?? RELEASES_URL, 302);
}
