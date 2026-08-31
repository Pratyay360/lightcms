import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { router } from "$lib/server/orpc/router";

export function createLightCmsClient(): RouterClient<typeof router> {
	const url =
		typeof window !== "undefined"
			? `${window.location.origin}/api/rpc`
			: "/api/rpc";

	const link = new RPCLink({
		url,
	});

	return createORPCClient(link);
}
