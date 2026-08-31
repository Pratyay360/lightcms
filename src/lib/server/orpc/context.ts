import { ORPCError, os } from "@orpc/server";
import type { Session } from "better-auth";

export type RpcContext = {
	session: Session | null;
};

const base = os.$context<RpcContext>();

/**
 * Public procedure — no auth required.
 */
export const publicProcedure = base;

/**
 * Protected procedure — throws UNAUTHORIZED if session is missing.
 * Downstream procedures receive `session` as a non-null value.
 */
export const authedProcedure = base.use(({ context, next }) => {
	if (!context.session) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "Authentication required.",
		});
	}

	return next({
		context: {
			session: context.session,
		},
	});
});
