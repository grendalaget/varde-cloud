import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { withSameOrigin } from "@/lib/csrf";

const handlers = toNextJsHandler(auth.handler);
export const GET = handlers.GET;
export const POST = withSameOrigin(handlers.POST);
