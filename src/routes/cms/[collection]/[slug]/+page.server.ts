import { error, fail, redirect } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { buildEntrySchema } from "$lib/schemas/entry";
import {
  buildFrontMatter,
  createCollectionEntry,
  deleteCollectionEntry,
  type FrontMatter,
  getCollectionEntry,
  moveCollectionEntry,
  updateCollectionEntry,
} from "$lib/server/cms";

import { getConfiguredCollection } from "$lib/server/cms-context";
import { isGitHubStatus } from "$lib/server/github";
import { joinPath, normalizeFolder } from "$lib/server/paths";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params, url }) => {
  if (!locals.session) {
    throw redirect(302, "/auth");
  }

  const { collection, ctx, query, selection } = await getConfiguredCollection(
    locals.session.userId,
    url,
    params.collection,
  );

  const folder = normalizeFolder(url.searchParams.get("folder") ?? "");
  const schema = buildEntrySchema(collection);

  if (params.slug === "new") {
    const emptyEntry = buildEmptyFormData(collection);
    const form = await superValidate(emptyEntry, zod4(schema));

    return {
      isNew: true,
      query,
      collection,
      selection,
      folder,
      primaryField: collection.view?.primary ?? collection.fields[0].name,
      entry: {
        slug: String(emptyEntry.slug),
        path: joinPath(collection.path, folder),
        body: "",
        frontMatter: {} as FrontMatter,
      },
      form,
    };
  }

  const entry = await getCollectionEntry(collection, params.slug, ctx, folder);
  const formData = {
    slug: entry.slug,
    body: entry.body,
    ...flattenFrontMatter(collection, entry.frontMatter),
  };
  const form = await superValidate(formData, zod4(schema));

  return {
    isNew: false,
    query,
    collection,
    selection,
    folder,
    primaryField: collection.view?.primary ?? collection.fields[0].name,
    entry,
    form,
  };
};

export const actions: Actions = {
  save: async ({ locals, request, params, url }) => {
    if (!locals.session) {
      throw redirect(302, "/auth");
    }

    const { collection, ctx, query } = await getConfiguredCollection(
      locals.session.userId,
      url,
      params.collection,
    );

    const folder = normalizeFolder(url.searchParams.get("folder") ?? "");
    const schema = buildEntrySchema(collection);
    const form = await superValidate(request, zod4(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const {
      slug: _slug,
      body,
      ...rawFieldValues
    } = form.data as {
      slug: string;
      body: string;
      [key: string]: unknown;
    };
    const collectionUrl = `/cms/${encodeURIComponent(collection.name)}?${appendFolder(query, folder)}`;

    let frontMatter: FrontMatter;
    try {
      frontMatter = buildFrontMatter(collection, rawFieldValues);
    } catch (cause) {
      return setError(
        form,
        "",
        cause instanceof Error ? cause.message : "Some fields are invalid.",
      );
    }

    if (params.slug === "new") {
      try {
        await createCollectionEntry(collection, _slug, frontMatter, body, ctx, folder);
      } catch (cause) {
        throw new Error(cause instanceof Error ? cause.message : String(cause));
      }
      throw redirect(303, collectionUrl);
    }

    try {
      await updateCollectionEntry(collection, params.slug, _slug, frontMatter, body, ctx, folder);
    } catch (cause) {
      return setError(
        form,
        "",
        cause instanceof Error ? cause.message : "Could not update the entry.",
      );
    }

    // If the slug changed, redirect to the new URL
    if (_slug !== params.slug) {
      const entryUrl = `/cms/${encodeURIComponent(collection.name)}/${encodeURIComponent(_slug)}?${appendFolder(query, folder)}`;
      throw redirect(303, entryUrl);
    }

    return message(form, "Saved successfully.");
  },

  delete: async ({ locals, params, url }) => {
    if (!locals.session) {
      throw redirect(302, "/auth");
    }

    if (params.slug === "new") {
      throw error(400, "Cannot delete an entry that hasn't been created yet.");
    }

    const { collection, ctx, query } = await getConfiguredCollection(
      locals.session.userId,
      url,
      params.collection,
    );

    const folder = normalizeFolder(url.searchParams.get("folder") ?? "");

    try {
      await deleteCollectionEntry(collection, params.slug, ctx, folder);
    } catch (cause) {
      throw error(
        isGitHubStatus(cause, 404) ? 404 : 500,
        cause instanceof Error ? cause.message : "Could not delete the entry.",
      );
    }

    const collectionUrl = `/cms/${encodeURIComponent(collection.name)}?${appendFolder(query, folder)}`;
    throw redirect(303, collectionUrl);
  },

  move: async ({ locals, request, params, url }) => {
    if (!locals.session) {
      throw redirect(302, "/auth");
    }

    if (params.slug === "new") {
      throw error(400, "Cannot move an entry that has not been created yet.");
    }

    const { collection, ctx, query } = await getConfiguredCollection(
      locals.session.userId,
      url,
      params.collection,
    );

    const folder = normalizeFolder(url.searchParams.get("folder") ?? "");
    const formData = await request.formData();
    const rawToFolder = formData.get("toFolder");
    const rawNewSlug = formData.get("newSlug");

    const toFolder = typeof rawToFolder === "string" ? rawToFolder.trim() : "";
    let newSlug = params.slug;
    if (typeof rawNewSlug === "string" && rawNewSlug.trim().length > 0) {
      newSlug = rawNewSlug.trim();
    }

    try {
      await moveCollectionEntry(collection, params.slug, folder, toFolder, ctx, newSlug);
    } catch (cause) {
      return fail(400, {
        moveError: cause instanceof Error ? cause.message : "Could not move entry.",
      });
    }

    const entryUrl = `/cms/${encodeURIComponent(collection.name)}/${encodeURIComponent(newSlug)}?${appendFolder(query, toFolder)}`;
    throw redirect(303, entryUrl);
  },
};

function appendFolder(query: string, folder: string) {
  const params = new URLSearchParams(query);
  if (folder) params.set("folder", folder);
  return params.toString();
}

function buildEmptyFormData(collection: {
  fields: { name: string; type: string; required?: boolean; list?: boolean }[];
}): Record<string, unknown> {
  // Default new-entry date as UTC — matches the ISO 8601 UTC storage format
  // and the UTC-only semantics used for <input type="datetime-local"> here.
  const localNow = new Date().toISOString().slice(0, 16);

  const data: Record<string, unknown> = {
    slug: Math.floor(Date.now() / 1000).toString(),
    body: "",
  };

  for (const field of collection.fields) {
    if (field.name === "body" || field.name === "slug") continue;
    if (field.list) {
      data[field.name] = [];
      continue;
    }
    switch (field.type) {
      case "checkbox":
        data[field.name] = false;
        break;
      case "datetime":
        data[field.name] = field.required ? localNow : "";
        break;
      case "number":
        data[field.name] = field.required ? 0 : "";
        break;
      case "json":
        data[field.name] = "";
        break;
      default:
        data[field.name] = "";
    }
  }

  return data;
}
function toDatetimeLocal(value: string): string {
  const spaceUtcMatch = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::\d{2})? UTC$/);
  if (spaceUtcMatch) {
    const [, y, m, d, h, min] = spaceUtcMatch;
    const utcDate = new Date(`${y}-${m}-${d}T${h}:${min}:00Z`);
    if (!Number.isNaN(utcDate.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${y}-${m}-${d}T${pad(utcDate.getUTCHours())}:${pad(utcDate.getUTCMinutes())}`;
    }
  }

  const dateObj = new Date(value);
  if (!Number.isNaN(dateObj.getTime())) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dateObj.getUTCFullYear()}-${pad(dateObj.getUTCMonth() + 1)}-${pad(dateObj.getUTCDate())}T${pad(dateObj.getUTCHours())}:${pad(dateObj.getUTCMinutes())}`;
  }

  return value.length >= 16 ? value.slice(0, 16) : value;
}
function flattenFrontMatter(
  collection: { fields: { name: string; type: string; list?: boolean }[] },
  frontMatter: FrontMatter,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of collection.fields) {
    if (field.name === "body" || field.name === "slug") continue;
    const value = frontMatter[field.name];
    if (value === undefined || value === null) {
      if (field.list) {
        result[field.name] = [];
      } else if (field.type === "checkbox") {
        result[field.name] = false;
      } else {
        result[field.name] = "";
      }
      continue;
    }
    if (field.type === "datetime" && typeof value === "string") {
      result[field.name] = toDatetimeLocal(value);
      continue;
    }
    if (field.type === "json") {
      if (typeof value === "string") {
        result[field.name] = value;
      } else {
        try {
          result[field.name] = JSON.stringify(value, null, 2);
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          result[field.name] = String(value);
        }
      }
      continue;
    }
    if (field.type === "number") {
      result[field.name] = value;
      continue;
    }
    if (field.list && Array.isArray(value)) {
      result[field.name] = value;
      continue;
    }
    if (field.list && typeof value === "string") {
      result[field.name] = [value];
      continue;
    }
    if (field.type === "checkbox") {
      result[field.name] = Boolean(value);
      continue;
    }
    result[field.name] = value;
  }
  return result;
}
