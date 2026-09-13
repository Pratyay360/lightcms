import type { Context } from "probot";
import { wrapBotError } from "./error-handler.js";

export async function handlePush(context: Context<"push">) {
  const { payload, log } = context;
  const { ref, repository, commits, head_commit, sender } = payload;
  const defaultBranch = repository.default_branch;
  const branch = ref.replace("refs/heads/", "");

  if (branch !== defaultBranch) {
    log.debug({ branch, defaultBranch }, "Skipping non-default branch push");
    return;
  }

  const relevant = (commits ?? []).filter((commit) =>
    (commit.modified ?? []).some((p) => p.endsWith(".md")),
  );

  if (relevant.length === 0) {
    log.debug("No content changes in this push");
    return;
  }

  log.info(
    {
      commits: relevant.length,
      sender: sender?.login,
      branch,
    },
    "Content push detected",
  );

  const owner = repository.owner?.login ?? "";
  const repoName = repository?.name ?? "";

  for (const commit of relevant) {
    for (const file of [...(commit.modified ?? []), ...(commit.added ?? [])]) {
      if (!file.endsWith(".md")) continue;

      try {
        const { data: contents } = await context.octokit.rest.repos.getContent({
          owner,
          repo: repoName,
          path: file,
          ref: head_commit?.id ?? branch,
        });

        if ("content" in contents && typeof contents.content === "string") {
          const decoded = Buffer.from(contents.content, "base64").toString("utf-8");
          const hasFrontMatter = decoded.startsWith("---");

          if (hasFrontMatter) {
            const endIndex = decoded.indexOf("---", 3);
            if (endIndex === -1) {
              log.warn({ file }, "Unclosed frontmatter delimiter in content file");
            }
          }
        }
      } catch (error) {
        wrapBotError(error);
      }
    }
  }
  if (head_commit) {
    try {
      await context.octokit.rest.repos.createCommitStatus({
        owner,
        repo: repoName,
        sha: head_commit.id,
        state: "success",
        context: "lightcms/content",
        description: `${relevant.length} content commit(s) processed`,
      });
    } catch (error) {
      wrapBotError(error);
    }
  }
}
