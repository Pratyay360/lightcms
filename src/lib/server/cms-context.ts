import { error, redirect } from "@sveltejs/kit";
import { getCollection, type LightCmsCollection } from "$lib/server/config";
import { getCmsContext } from "$lib/server/session";

export type CmsSelection = {
  installationId: number;
  repository: string;
  branch?: string;
};

export function getCmsSelection(url: URL): CmsSelection {
  const repository = url.searchParams.get("repository")?.trim();
  const rawInstallationId =
    url.searchParams.get("installation")?.trim() || url.searchParams.get("installationId")?.trim();
  const installationId = rawInstallationId ? Number(rawInstallationId) : NaN;
  const branch = url.searchParams.get("branch")?.trim() || undefined;

  if (!repository || !Number.isInteger(installationId) || installationId <= 0) {
    throw error(400, "Invalid CMS selection");
  }

  return { installationId, repository: repository, branch };
}

export function getCmsQuery(selection: CmsSelection): string {
  const query = new URLSearchParams({
    installation: String(selection.installationId),
    repository: selection.repository,
  });
  if (selection.branch) query.set("branch", selection.branch);
  return query.toString();
}

export async function getConfiguredCollection(userId: string, url: URL, collectionName: string) {
  const selection = getCmsSelection(url);
  if (!selection) throw redirect(302, "/cms");
  const ctx = await getCmsContext(
    userId,
    selection.installationId,
    selection.repository,
    selection.branch,
  );

  let collection: LightCmsCollection;
  try {
    collection = getCollection(collectionName);
  } catch {
    throw error(404, `${collectionName}`);
  }

  return {
    collection,
    ctx,
    selection,
    query: getCmsQuery(selection),
  };
}
