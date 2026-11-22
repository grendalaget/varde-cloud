import { latestRelease } from "@/lib/release";
import { downloadResponse } from "@/lib/download-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ target: string }> },
) {
  const { target } = await params;
  return downloadResponse(target, latestRelease);
}
