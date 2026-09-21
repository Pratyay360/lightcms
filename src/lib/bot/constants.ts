/**
 * Shared constants for the LightCMS GitHub bot.
 *
 * Centralizing magic strings here keeps event handlers consistent and
 * makes future changes (label renames, new content extensions) trivial.
 */

/** File extensions treated as CMS-managed content. */
export const CONTENT_EXTENSIONS: readonly string[] = [".md", ".mdx"];

/** Label applied to pull requests that touch content files. */
export const CONTENT_LABEL = "content";

/** Marker used to find and update the bot's own review comment. */
export const REVIEW_MARKER = "LightCMS Content Review";

/** Commit-status context reported on content pushes. */
export const COMMIT_STATUS_CONTEXT = "lightcms/content";

/** Number of files fetched per page when listing PR files or comments. */
export const GITHUB_PAGE_SIZE = 100;
