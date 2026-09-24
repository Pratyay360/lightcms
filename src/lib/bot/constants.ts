export const CONTENT_EXTENSIONS: readonly string[] = [".md", ".smd", ".mdx"];

/** Label applied to pull requests that touch content files. */
export const CONTENT_LABEL = "content";

/** Marker used to find and update the bot's own review comment. */
export const REVIEW_MARKER = "LightCMS Content Review";

/** Commit-status context reported on content pushes. */
export const COMMIT_STATUS_CONTEXT = "lightcms/content";

export const GITHUB_PAGE_SIZE = 100;
