import type { Context } from "probot";
import { wrapBotError } from "./error-handler.js";

export async function handlePing(context: Context<"ping">) {
  const { payload, log } = context;

  log.info(
    {
      hook: payload.hook?.id,
      zen: payload.zen,
    },
    "GitHub App ping received — handshake successful",
  );

  if (payload.repository) {
    const owner = payload.repository.owner?.login ?? payload.repository.owner?.name;
    const repo = payload.repository.name;

    if (owner && repo) {
      try {
        const { data: issues } = await context.octokit.rest.issues.listForRepo({
          owner,
          repo,
          state: "open",
          per_page: 1,
        });

        if (issues.length > 0) {
          await context.octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: issues[0].number,
            body: `👋 LightCMS bot is now watching this repository!\n\n_${payload.zen}_`,
          });
        }
      } catch (error) {
        wrapBotError(error);
      }
    }
  }
}
