import { LaunchPage } from "@/components/launch-page";
import { COMPARE_PAGES, launchMetadata } from "@/lib/launch-content";

const page = COMPARE_PAGES[0];

export const metadata = launchMetadata(page);

export default function Page() {
  return <LaunchPage page={page} />;
}
