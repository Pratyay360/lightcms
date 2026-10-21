const MARKDOWN_EXTENSION = ".md";
const COLLECTION_DIRECTORY = /^[a-z0-9_-]+$/;
const NEW_ENTRY_SLUG = "new";

/**
 * Maps a repository file path to its collection editor URL
 * (`/cms/[collection]/[slug]`): the top-level directory is the collection,
 * the directories in between become the `folder` query param, and the
 * filename without `.md` is the slug.
 *
 * Returns `undefined` for files the collection editor cannot open: non-`.md`
 * files, files at the repository root, directories that are not valid
 * collection names, and a `new.md` slug that would collide with the
 * "create entry" route.
 */
export function collectionEntryUrl(filePath: string, query: string): string | undefined {
  const segments = filePath.split("/").filter(Boolean);
  const filename = segments.pop();
  const [collection, ...folderSegments] = segments;

  if (!filename || !collection || !filename.endsWith(MARKDOWN_EXTENSION)) return undefined;
  if (!COLLECTION_DIRECTORY.test(collection)) return undefined;

  const slug = filename.slice(0, -MARKDOWN_EXTENSION.length);
  if (!slug || slug === NEW_ENTRY_SLUG) return undefined;

  const params = new URLSearchParams(query);
  if (folderSegments.length > 0) params.set("folder", folderSegments.join("/"));

  return `/cms/${encodeURIComponent(collection)}/${encodeURIComponent(slug)}?${params}`;
}
