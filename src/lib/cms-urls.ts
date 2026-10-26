const MARKDOWN_EXTENSION = ".md";
const COLLECTION_DIRECTORY = /^[a-z0-9_-]+$/;
const NEW_ENTRY_SLUG = "new";

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
