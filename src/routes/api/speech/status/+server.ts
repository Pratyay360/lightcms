import { json } from "@sveltejs/kit";
import { isWitConfigured } from "$lib/server/wit";
import type { RequestHandler } from "$types";

export const GET: RequestHandler = async () => {
  const configured = isWitConfigured();
  return json({
    configured,
    provider: "wit.ai",
  });
};
