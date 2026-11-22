import { LaunchPage } from "@/components/launch-page";
import { GAME_PAGES, launchMetadata } from "@/lib/launch-content";

const page = GAME_PAGES[2];

export const metadata = launchMetadata(page);

export default function Page() {
  return <LaunchPage page={page} />;
}
