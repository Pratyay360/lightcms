import { ORPCError } from "@orpc/server";

/**
 * Wrap an unknown error into an ORPCError with the original message.
 * Eliminates the repeated `error instanceof Error ? error.message : String(error)` pattern.
 */
export function wrapBotError(error: unknown): never {
	const message = error instanceof Error ? error.message : String(error);
	throw new ORPCError("INTERNAL_SERVER_ERROR", { message });
}
