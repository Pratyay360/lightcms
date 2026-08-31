import type { Context } from "probot";
import { wrapBotError } from "./error-handler.js";

export async function handleInstallation(context: Context<"installation">) {
	const { payload, log } = context;
	const { action, repositories, installation, sender } = payload;
	const account = installation?.account;
	const accountLogin =
		account && "login" in account
			? account.login
			: account && "slug" in account
				? account.slug
				: sender?.login;

	switch (action) {
		case "created": {
			const repoCount = repositories?.length;
			log.info(
				{
					account: accountLogin,
					repos: repoCount,
				},
				"LightCMS bot installed",
			);

			if (repositories && repositories.length > 0) {
				for (const repo of repositories.slice(0, 5)) {
					try {
						await context.octokit.rest.issues.create({
							owner: accountLogin,
							repo: repo.name,
							title: "👋 LightCMS bot is now active",
							body: "",
						});
					} catch (error) {
						wrapBotError(error);
					}
				}
			}
			break;
		}

		case "deleted": {
			log.info(
				{
					account: accountLogin,
				},
				"LightCMS bot uninstalled",
			);
			break;
		}
	}
}
