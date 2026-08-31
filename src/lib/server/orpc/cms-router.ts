import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { buildEntrySchema, slugSchema } from "$lib/schemas/entry";
import {
  createCollectionEntry,
  createFileAtPath,
  createFolderAtPath,
  deleteCollectionEntry,
  deleteFolderAtPath,
  getCollectionEntry,
  initializePath,
  listDirectory,
  updateCollectionEntry,
} from "$lib/server/cms";
import { getCollection } from "$lib/server/config";
import { getCmsContext } from "$lib/server/session";
import { authedProcedure } from "./context";

const repoInput = z.object({
  installationId: z.number().int().positive(),
  repository: z.string().trim().min(1),
  branch: z.string().trim().optional(),
  slug: z.string().trim().min(1),
  collectionName: z.string().trim().min(1),
});

async function resolveCollectionCtx(sessionUserId: string, input: z.infer<typeof repoInput>) {
  const ctx = await getCmsContext(
    sessionUserId,
    input.installationId,
    input.repository,
    input.branch,
  );

  let collection: ReturnType<typeof getCollection>;
  try {
    collection = getCollection(input.collectionName);
  } catch {
    throw new ORPCError("NOT_FOUND", {
      message: `Collection not found: ${input.collectionName}`,
    });
  }

  return { collection, ctx };
}

/**
 * Resolve CMS context from session + input params. Shared by all file/folder/dir handlers.
 */
async function resolveCtx(
  sessionUserId: string,
  input: { installationId: number; repository: string; branch?: string },
) {
  return getCmsContext(sessionUserId, input.installationId, input.repository, input.branch);
}

/**
 * Execute an async operation and wrap any error in an ORPCError.
 * Eliminates the repeated try/catch + cause.message pattern across handlers.
 */
async function orpcTry<T>(
  fn: () => Promise<T>,
  errorCode: "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "NOT_FOUND",
  fallbackMessage: string,
): Promise<T> {
  try {
    return await fn();
  } catch (cause) {
    throw new ORPCError(errorCode, {
      message: cause instanceof Error ? cause.message : fallbackMessage,
    });
  }
}

const getEntry = authedProcedure
  .input(repoInput.extend({ slug: z.string().trim().min(1) }))
  .handler(async ({ input, context }) => {
    const { collection, ctx } = await resolveCollectionCtx(context.session.userId, input);
    return orpcTry(
      () => getCollectionEntry(collection, input.slug, ctx),
      "NOT_FOUND",
      `Entry not found: ${input.slug}`,
    );
  });

const createEntry = authedProcedure
  .input(
    repoInput.extend({
      slug: slugSchema,
      fields: z.record(z.string(), z.unknown()),
      body: z.string().default(""),
    }),
  )
  .handler(async ({ input, context }) => {
    const { collection, ctx } = await resolveCollectionCtx(context.session.userId, input);

    // Validate fields against the dynamic collection schema
    const entrySchema = buildEntrySchema(collection);
    const parsed = entrySchema.safeParse({
      ...input.fields,
      slug: input.slug,
      body: input.body,
    });
    if (!parsed.success) {
      throw new ORPCError("BAD_REQUEST", {
        message: parsed.error.issues.map((i) => i.message).join("; "),
      });
    }

    const { slug, body, ...fieldValues } = parsed.data as {
      slug: string;
      body: string;
      [key: string]: unknown;
    };

    return orpcTry(
      () => createCollectionEntry(collection, slug, fieldValues, body, ctx),
      "INTERNAL_SERVER_ERROR",
      "Could not create the entry.",
    );
  });

/**
 * Update an existing entry.
 */
const updateEntry = authedProcedure
  .input(
    repoInput.extend({
      currentSlug: z.string().trim().min(1),
      slug: slugSchema,
      fields: z.record(z.string(), z.unknown()),
      body: z.string().default(""),
    }),
  )
  .handler(async ({ input, context }) => {
    const { collection, ctx } = await resolveCollectionCtx(context.session.userId, input);

    const entrySchema = buildEntrySchema(collection);
    const parsed = entrySchema.safeParse({
      ...input.fields,
      slug: input.slug,
      body: input.body,
    });
    if (!parsed.success) {
      throw new ORPCError("BAD_REQUEST", {
        message: parsed.error.issues.map((i) => i.message).join("; "),
      });
    }

    const { slug, body, ...fieldValues } = parsed.data as {
      slug: string;
      body: string;
      [key: string]: unknown;
    };

    return orpcTry(
      () => updateCollectionEntry(collection, input.currentSlug, slug, fieldValues, body, ctx),
      "INTERNAL_SERVER_ERROR",
      "Could not update the entry.",
    );
  });

/**
 * Delete an entry by slug.
 */
const deleteEntry = authedProcedure
  .input(repoInput.extend({ slug: z.string().trim().min(1) }))
  .handler(async ({ input, context }) => {
    const { collection, ctx } = await resolveCollectionCtx(context.session.userId, input);

    return orpcTry(
      () => deleteCollectionEntry(collection, input.slug, ctx),
      "INTERNAL_SERVER_ERROR",
      "Could not delete the entry.",
    );
  });

const folderInput = z.object({
  installationId: z.number().int().positive(),
  repository: z.string().trim().min(1),
  branch: z.string().trim().optional(),
  targetPath: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

const fileInput = z.object({
  installationId: z.number().int().positive(),
  repository: z.string().trim().min(1),
  branch: z.string().trim().optional(),
  filePath: z.string().trim().min(1),
  content: z.string().default(""),
  message: z.string().trim().optional(),
});

const dirInput = z.object({
  installationId: z.number().int().positive(),
  repository: z.string().trim().min(1),
  branch: z.string().trim().optional(),
  directoryPath: z.string().trim().min(1),
});

/**
 * Dynamic folder creation — no hard-coded CONTENT_ROOT.
 * Creates `targetPath/name/.gitkeep` via modular path helpers.
 */ const createFolder = authedProcedure.input(folderInput).handler(async ({ input, context }) => {
  const ctx = await resolveCtx(context.session.userId, input);
  return orpcTry(
    () => createFolderAtPath(input.targetPath, input.name, ctx),
    "BAD_REQUEST",
    "Could not create folder.",
  );
});

/**
 * Dynamic file creation — fully modular path.
 */ const createFile = authedProcedure.input(fileInput).handler(async ({ input, context }) => {
  const ctx = await resolveCtx(context.session.userId, input);
  return orpcTry(
    () =>
      createFileAtPath(input.filePath, input.content, ctx, {
        message: input.message,
      }),
    "BAD_REQUEST",
    "Could not create file.",
  );
});
const listDir = authedProcedure.input(dirInput).handler(async ({ input, context }) => {
  const ctx = await resolveCtx(context.session.userId, input);
  return orpcTry(
    () => listDirectory(input.directoryPath, ctx),
    "INTERNAL_SERVER_ERROR",
    "Could not list directory.",
  );
});
const initializeDir = authedProcedure.input(dirInput).handler(async ({ input, context }) => {
  const ctx = await resolveCtx(context.session.userId, input);
  return orpcTry(
    () => initializePath(input.directoryPath, ctx),
    "BAD_REQUEST",
    "Could not initialize directory.",
  );
});

const deleteFolder = authedProcedure.input(dirInput).handler(async ({ input, context }) => {
  const ctx = await resolveCtx(context.session.userId, input);
  return orpcTry(
    () => deleteFolderAtPath(input.directoryPath, ctx),
    "BAD_REQUEST",
    "Could not delete folder.",
  );
});

export const cmsRouter = {
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  createFolder,
  createFile,
  listDir,
  initializeDir,
  deleteFolder,
};
