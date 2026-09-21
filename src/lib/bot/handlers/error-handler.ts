import type { Context } from "probot";

type BotLogContext = Pick<Context, "log">;

/**
 * Log a bot failure without interrupting sibling operations.
 *
 * Probot handlers must never throw framework-agnostic RPC errors for
 * routine GitHub API failures. Logging keeps one failing file or comment
 * from aborting the rest of the webhook, while `onError` in
 * `src/lib/bot/index.ts` still captures truly unexpected throws.
 */
export function logBotError(
	context: BotLogContext,
	message: string,
	error: unknown,
): void {
	if (error instanceof Error) {
		context.log.error({ err: error }, message);
		return;
	}
	context.log.error({ err: String(error) }, message);
}
