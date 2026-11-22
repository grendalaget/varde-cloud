import { LaunchPage } from "@/components/launch-page";
import { FAQ_PAGE, launchMetadata } from "@/lib/launch-content";

const page = FAQ_PAGE;

export const metadata = launchMetadata(page);

export default function Page() {
  return <LaunchPage page={page} />;
}
