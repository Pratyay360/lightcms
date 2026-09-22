import type { Context } from "probot";

/**
 * Handle the `ping` handshake event.
 *
 * Ping carries no repository work. Previous revisions commented on an
 * arbitrary open issue, which is noisy and surprising, so this handler
 * intentionally performs no Octokit calls and only records the handshake.
 */
export async function handlePing(context: Context<"ping">): Promise<void> {
  const { payload, log } = context;

  log.info(
    {
      hookId: payload.hook?.id,
      zen: payload.zen,
    },
    "GitHub App ping received — handshake successful",
  );
}
