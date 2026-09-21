import type { ApplicationFunction, Probot } from "probot";
import { handleInstallation } from "./handlers/installation.js";
import { handlePing } from "./handlers/ping.js";
import { handlePullRequest } from "./handlers/pull-request.js";
import { handlePush } from "./handlers/push.js";

/**
 * LightCMS GitHub bot entry point.
 *
 * Each handler is idempotent, logs instead of throwing for routine API
 * failures, and performs no work for unrelated branches, bot authors, or
 * non-content files. The global `onError` hook captures only unexpected
 * throws so one bad webhook cannot take down the process.
 */
const app: ApplicationFunction = (probotApp: Probot): void => {
	probotApp.onError(async (error: Error): Promise<void> => {
		probotApp.log.error({ err: error }, "Unhandled bot error");
	});

	probotApp.on("ping", handlePing);
	probotApp.on("push", handlePush);
	probotApp.on(
		["pull_request.opened", "pull_request.synchronize", "pull_request.closed"],
		handlePullRequest,
	);
	probotApp.on(
		["installation.created", "installation.deleted"],
		handleInstallation,
	);

	probotApp.log.info("LightCMS bot loaded");
};

export default app;
