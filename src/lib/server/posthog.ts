import { env } from "$env/dynamic/public";
import { PostHog } from "posthog-node";

let posthogClient: PostHog | undefined;

function getPostHogClient() {
  if (posthogClient) return posthogClient;

  const key = env.PUBLIC_POSTHOG_KEY?.trim();
  const host = env.PUBLIC_POSTHOG_HOST?.trim();

  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once PUBLIC_POSTHOG_KEY is configured",
      );
    }
    return;
  }

  if (!host) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once PUBLIC_POSTHOG_HOST is configured",
      );
    }
    return;
  }

  posthogClient = new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
  return posthogClient;
}

export async function captureServerEvent(distinctId: string, event: string) {
  const posthog = getPostHogClient();
  if (!posthog) return;

  posthog.capture({ distinctId, event });
  await posthog.flush();
}
