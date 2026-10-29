// Relative imports: the linter's module resolver does not follow tsconfig paths
// inside dot-directories, and tsc is the authority on types anyway.
import { getEnv } from "../../../lib/cloudflare";
import { handleJmapRequest } from "../../../lib/jmap/handler";

/** RFC 8620 §2.2 autodiscovery: redirects to the Session resource. */
export async function GET(request: Request) {
	return (await handleJmapRequest(request, getEnv())) ?? new Response("Not found", { status: 404 });
}
export const dynamic = "force-dynamic";
