import { getProbot } from "$lib/server/probot";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const eventName = request.headers.get("x-github-event");
  const signature = request.headers.get("x-hub-signature-256");
  const deliveryId = request.headers.get("x-github-delivery");

  if (!eventName || !signature || !deliveryId) {
    throw new Error("Missing required GitHub webhook headers");
  }

  const payload = await request.text();

  try {
    const probot = await getProbot();
    await probot.webhooks.verifyAndReceive({
      id: deliveryId,
      name: eventName,
      payload,
      signature,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message, { cause: error });
  }

  return new Response("OK", { status: 200 });
};
