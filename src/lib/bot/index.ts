import type { ApplicationFunction } from "probot";
import { handleInstallation } from "./handlers/installation";
import { handlePing } from "./handlers/ping";
import { handlePullRequest } from "./handlers/pull-request";
import { handlePush } from "./handlers/push";

const app: ApplicationFunction = (probot) => {
	probot.on("ping", handlePing);
	probot.on("push", handlePush);
	probot.on("pull_request.opened", handlePullRequest);
	probot.on("pull_request.synchronize", handlePullRequest);
	probot.on("pull_request.closed", handlePullRequest);
	probot.on("installation.created", handleInstallation);
	probot.on("installation.deleted", handleInstallation);
};

export default app;
