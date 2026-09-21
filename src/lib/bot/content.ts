import { CONTENT_EXTENSIONS } from "./constants.js";

/**
 * Check whether a repository path points to CMS-managed content.
 *
 * The comparison is case-insensitive so `Post.MD` and `guide.mdx`
 * are both recognized on case-insensitive filesystems.
 */
export function isContentPath(path: string): boolean {
	const normalized = path.toLowerCase();
	for (const extension of CONTENT_EXTENSIONS) {
		if (normalized.endsWith(extension)) {
			return true;
		}
	}
	return false;
}
