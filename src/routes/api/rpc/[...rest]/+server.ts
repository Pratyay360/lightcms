import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "$lib/server/orpc/router";
import type { RequestHandler } from "./$types";

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      // Observe only: rethrowing here would replace ORPCError status codes
      // (e.g. BAD_REQUEST) with a generic 500.
      console.error("[rpc error]", error instanceof Error ? error.message : String(error));
    }),
  ],
});

const handle: RequestHandler = async ({ locals, request }) => {
  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: { session: locals.session ?? null },
  });

  if (response) {
    return response;
  }

  return new Response("Not found", { status: 404 });
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
