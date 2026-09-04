export const CONTENT_ROOT = "";

export const DEFAULT_COLLECTION_NAME = "Posts";

export function sanitizeCollectionName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
}

export function resolveCollectionPath(name: string): string {
  const clean = sanitizeCollectionName(name);
  if (!clean) throw new Error(`Invalid collection name: ${name}`);
  return `${CONTENT_ROOT}/${clean}`;
}

export function isValidCollectionName(name: string): boolean {
  return sanitizeCollectionName(name) === name.toLowerCase() && name.length > 0;
}

export function assertCollectionName(name: string): string {
  const clean = sanitizeCollectionName(name);
  if (!clean) throw new Error(`Collection name must contain alphanumeric characters.`);
  return clean;
}

export function joinPath(directoryPath: string, folder: string): string {
  const trimmed = folder.replace(/^\/+|\/+$/g, "");
  if (!trimmed) return directoryPath;
  return directoryPath.endsWith("/") ? `${directoryPath}${trimmed}` : `${directoryPath}/${trimmed}`;
}

export function normalizeExtension(filename: string): string {
  return filename.endsWith(".md") ? filename : `${filename}.md`;
}

export function normalizePath(directoryPath: string, filename: string): string {
  const normalized = normalizeExtension(filename);
  return directoryPath.endsWith("/")
    ? `${directoryPath}${normalized}`
    : `${directoryPath}/${normalized}`;
}

export function getSlug(directoryPath: string, filePath: string): string {
  const normalized = normalizeExtension(filePath);
  const prefix = directoryPath.endsWith("/") ? directoryPath : `${directoryPath}/`;
  const relative = normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized;
  return relative.replace(/\.md$/, "");
}

export function resolveEntryPath(collectionPath: string, folder: string, filename: string): string {
  return normalizePath(joinPath(collectionPath, folder), filename);
}

export function normalizeFolder(folder: string): string {
  const value = folder?.trim() ?? "";
  const parts = value
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part !== "" && part !== ".");
  if (parts.some((part) => part === ".."))
    throw new Error("A folder path cannot contain '..' segments.");
  return parts.join("/");
}

function assertFolderSegment(name: string): void {
  if (!name || name.trim() === "") throw new Error("A folder segment is required.");
  if (name.includes("/") || name.includes("\\"))
    throw new Error("A folder segment cannot contain slashes.");
  if (name.trim().startsWith(".")) throw new Error("A folder segment cannot start with a dot.");
}

export function assertFolderName(name: string): void {
  if (!name || name.trim() === "") throw new Error("A folder name is required.");
  if (name.includes("/") || name.includes("\\"))
    throw new Error("A folder name cannot contain slashes.");
  if (name.trim().startsWith(".")) throw new Error("A folder name cannot start with a dot.");
  assertFolderSegment(name.trim());
}

export function normalizeContentPath(path: string | undefined | null): string {
  const raw = path?.trim() ?? "";
  if (!raw) return "";
  const withoutLeading = raw.replace(/^\/+|\/+$/g, "");
  const parts = withoutLeading
    .split("/")
    .map((p) => p.trim())
    .filter((p) => p !== "" && p !== ".");
  if (parts.some((p) => p === "..")) throw new Error("Path cannot contain '..' segments.");
  if (parts.slice(0, -1).some((p) => p.startsWith(".")))
    throw new Error("Folder segments cannot start with '.'");
  return parts.join("/");
}

export function assertContentPath(path: string, opts?: { allowEmpty?: boolean }): string {
  const normalized = normalizeContentPath(path);
  if (!normalized && !opts?.allowEmpty) throw new Error("Path is required.");
  if (normalized?.startsWith("/")) throw new Error("Path must be relative.");
  if (normalized.split("/").some((p) => p === "..")) throw new Error("Path cannot contain '..'.");
  return normalized;
}

export function ensureUnderContentRoot(path: string | undefined | null): string {
  const normalized = normalizeContentPath(path);
  if (!normalized) return CONTENT_ROOT;
  if (normalized === CONTENT_ROOT) return normalized;
  if (normalized.startsWith(`${CONTENT_ROOT}/`)) return normalized;
  if (!normalized.includes("/")) return `${CONTENT_ROOT}/${normalized}`;
  throw new Error(`Path must be inside "${CONTENT_ROOT}/" (got "${path}")`);
}

export function resolveContentPath(...segments: Array<string | undefined | null>): string {
  const parts = segments.map((s) => normalizeContentPath(s)).filter((s) => s.length > 0);
  if (parts.length === 0) return CONTENT_ROOT;
  const joined = parts.join("/");
  if (joined === CONTENT_ROOT || joined.startsWith(`${CONTENT_ROOT}/`)) return joined;
  return `${CONTENT_ROOT}/${joined}`;
}

export function buildContentPath(...segments: string[]): string {
  return resolveContentPath(...segments);
}

export function generateDefaultSlug(): string {
  return Math.floor(Date.now() / 1000).toString();
}
